document.addEventListener("DOMContentLoaded", () => {
  const button = document.getElementById("runTest");
  const output = document.getElementById("output");

  function log(text) {
    output.textContent += text + "\n";
  }

  function reset() {
    output.textContent = "";
  }

  function ipVersion(ip) {
    return ip.includes(":") ? "IPv6" : "IPv4";
  }

  function classifyCandidate(type) {
    switch (type) {
      case "host":
        return "Local / LAN IP exposed (High Leak Risk)";
      case "srflx":
        return "Public IP via STUN (VPN Leak Possible)";
      case "relay":
        return "TURN Relay (Low Risk)";
      default:
        return "Unknown";
    }
  }

  button.addEventListener("click", async () => {
    reset();
    log("Starting AmiLeaked test...\n");

    /* ===============================
       1. Regular network IP request
       =============================== */

    try {
      log("Fetching public IP via normal network request...");

      const res = await fetch("https://api64.ipify.org?format=json");
      const data = await res.json();

      log(`Network IP: ${data.ip}`);
      log(`IP Version: ${ipVersion(data.ip)}\n`);
    } catch (err) {
      log("ERROR: Failed to fetch public IP.");
      log(err.message + "\n");
    }

    /* ===============================
       2. WebRTC STUN candidate test
       =============================== */

    if (typeof RTCPeerConnection === "undefined") {
      log("ERROR: WebRTC is not available in this environment.");
      return;
    }

    log("Starting WebRTC ICE gathering...\n");

    const found = {
      host: false,
      srflx: false,
      relay: false,
      ipv6: false
    };

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:global.stun.twilio.com:3478" }
      ]
    });

    pc.createDataChannel("amileaked-test");

    pc.onicecandidate = (event) => {
      if (!event.candidate) return;

      const parts = event.candidate.candidate.split(" ");

      const candidate = {
        protocol: parts[2],
        ip: parts[4],
        port: parts[5],
        type: parts[7]
      };

      found[candidate.type] = true;
      if (candidate.ip.includes(":")) found.ipv6 = true;

      log(
`WebRTC Candidate:
  IP: ${candidate.ip}
  Port: ${candidate.port}
  Protocol: ${candidate.protocol.toUpperCase()}
  Type: ${candidate.type}
  Assessment: ${classifyCandidate(candidate.type)}
`
      );
    };

    pc.onicegatheringstatechange = () => {
      if (pc.iceGatheringState === "complete") {
        log("ICE gathering complete.\n");
        summarize(found);
        pc.close();
      }
    };

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
    } catch (err) {
      log("ERROR: WebRTC initialization failed.");
      log(err.message);
    }
  });

  function summarize(found) {
    log("=== Summary ===");

    if (found.host) {
      log("• Local IP exposed via WebRTC");
    }

    if (found.srflx) {
      log("• Public IP exposed via STUN");
    }

    if (found.ipv6) {
      log("• IPv6 detected (common VPN bypass vector)");
    }

    if (!found.host && !found.srflx && !found.relay) {
      log("• No ICE candidates detected (WebRTC blocked or protected)");
    }
  }
});
