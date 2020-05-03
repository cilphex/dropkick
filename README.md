<img src="public/images/logo.png" alt="Dropkick Logo" width="300"/>

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

--

**Serving the static website**

This site is deployed using Google Cloud. A Cloud Build trigger detects pushes
to master and runs the steps in `cloudbuild.yaml`. Those steps build the flat
files and copy them to a public bucket.

The public bucket can be served directly as a flat HTTP site
[using these steps](https://cloud.google.com/storage/docs/hosting-static-website).
However, [modern browsers will not allow access to requested source devices
(webcams, etc) unless the connection is secure (HTTPS)](https://stackoverflow.com/questions/34197653/getusermedia-in-chrome-47-without-using-https).
This means that this flat-file site will not work unless served over HTTPS.

To create an HTTPS site, the bucket can be used as a backend for a Google Cloud
external-HTTPS load balancer, [as described in this guide](https://cloud.google.com/load-balancing/docs/https/ext-load-balancer-backend-buckets).

As a production note to self for future projects served similarly, remember
that a newly-created certificate won't finish provisioning until the relevant
domains have had their A-records updated to point to the load balancer's IP,
and that it may take an additional few minutes for HTTPS to begin working after
HTTP.