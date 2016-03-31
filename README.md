<img src="images/logo.png" alt="Dropkick Logo" width="300"/>

_"Like snapchat for files"_ — Somebody

[View live version on Github Pages](https://cilphex.github.io/dropkick/)

--

**Notice**

Still in development, only the "happy path" works, and it only works in Chrome 49+.

--

**Overview**

Dropkick lets you:
- Send a single file
- Only once
- Securely

It does this by opening peer-to-peer connection between your web browser and
another, using WebRTC.

Once the connection is established, the receiving party confirms their identity
by taking a selfie and sending it back to you inline on the page. When you
approve their ID, the file is sent their way.

It is a mashup of new security (WebRTC is OpenSSL-encrypted by default) and
old-fashioned security (looking at somebody's face). Its purpose is to quickly
and easily deliver sensitive files to known recipients who may be in close
proximity.

The file being delivered never resides on a server. It is served directly from
your web browser, and ceases to be served when your browser tab closes.

--

**Technicals**

It's flat html and javascript that's built using `grunt`, with the help of
`bower` for package management.

```
npm i -g grunt bower
npm i
bower install
grunt
```

(I think)

To rebuild html, css, and js changes from source as you write it:

```
grunt watch
```
