# 🧙‍♂️ The Planeswalkers Nexus 🧙‍♀️🪄

A SpellTable alternative for playing Magic: The Gathering online using a webcam and your real cards!

## Roadmap

- [ ] Create a web app to create or join rooms using [Nextjs](https://nextjs.org/)
- [ ] Fill web app with cool game features (Life totals, counters, card recognition and many more...)
- [ ] Create a server for all the web sockets, room caching and whatnots...

## Hosting and costs

- [ ] Hosted on some kind of VPS
- [ ] Domain and reverse proxy (with [Caddy](https://caddyserver.com/))

## todos

- [ ] Persistend Player Id (no auth) + prevention from random connection drops or refreshes
- [ ] Clean up and sanitize on server all data inputs
- [ ] Check for correct aspect ratio in video display
- [ ] Implement WebRTC client to client stream
- [ ] Secure ips from p2p if possible (dont think so)
