# WebRTC IP Leak Detection Tool

This simple web app demonstrates how WebRTC can expose IP addresses that may be different from what is seen by regular network requests. It is designed to identify potential VPN leaks using standard browser behavior.

## What it does

- Fetches the user's public IP using a regular network request
- Creates a WebRTC peer connection
- Collects ICE candidates via STUN servers
- Displays discovered IP addresses and their sources source
- Highlights possible IP vectors (IPv4 / IPv6)

## How it works

1. A normal HTTP request retrieves the public IP typically seen by websites
2. WebRTC uses STUN servers to discover additional network paths
3. Each discovered ICE candidate is logged and classified
4. Certain differences between the two can indicate a WebRTC leak

## How to run

1. Place `index.html` and `app.js` in the same directory
2. Start a local server within the directory. This can be done by various means, but with python it can be done with this command:
```bash
   py -m http.server 8000
```
3. Open your browser and visit:
```
   http://localhost:8000
```
4. Click **Start Test**

## Interpreting results

- **Host candidates**: Local or interface IPs (high leak risk)
- **Server reflexive candidates (srflx)**: Public IPs discovered via STUN
- **Relay candidates**: TURN-relayed addresses (low leak risk)

If the WebRTC-discovered IP differs from the regular public IP, a VPN or network leak may be present.

## Notes

- Results vary by browser and OS
- IPv6 addresses are commonly exposed even when a VPN is active
- No traffic is sent to peers, this app only gathers ICE candidates

## Purpose

This tool is intended for educational use to better understand WebRTC networking behavior and privacy implications.
