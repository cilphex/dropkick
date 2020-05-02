<img src="images/logo.png" alt="Dropkick Logo" width="300"/>

_"Like snapchat meets dropbox"_ — Somebody

[View live version on Github Pages](https://cilphex.github.io/dropkick/)

--

**Notice**

This was a hackathon project so it may have bugs.

--

**Overview**

Dropkick lets you:
- Send a single file
- Only once
- Securely

It does this by opening peer-to-peer connection between your web browser and
another, using WebRTC.

Once the connection is established, the receiving party confirms their identity
by sharing a video of themselves with you. When you approve their identity, the
file is sent on its way.

It is a mashup of new security (WebRTC is OpenSSL-encrypted by default) and
old-fashioned security (looking at somebody's face). Its purpose is to quickly
and easily deliver sensitive files to known recipients who may be in close
proximity.

The file being delivered never resides on a server. It is served directly from
your web browser, and ceases to be served when your browser tab closes. Same
applies to the video feed.

Some initial negotiation does happen through a server, but only to establish
the p2p connection.

--

**Todo**

- You currently need to enable the webcam as the sender, but ideally you
  wouldn't have to.

--

**Technicals**

Run locally with webpack dev server

```
yarn install
yarn start:dev
```

Build into flat files to be served

```
yarn build
```