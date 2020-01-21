# Dana - The Stream Gatekeeper

A React based front-end demo for Asterisk's SFU capabilities - designed to show how you'd build a solution using modern JavaScript tooling such as React

You'll need Node.js installed on your dev environment and prferably Yarn over npm.

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app), and utilises [Material-UI](https://material-ui.com/) and [JsSIP](https://jssip.net/)

## Install

```bash
yarn
```

## Run

```bash
yarn start
```

Runs the app in the development mode.<br />
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br />
You will also see any lint errors in the console.

## Build for production

```bash
yarn build
```

Builds the app for production to the `build` folder.<br />
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br />
Your app is ready to be deployed!

## Asterisk Requirements

You will require your own Asterisk server and to place your asterisk server details into the settings page of the app (`/settings`)
These include your Name, a SIP URI that represents your extension, the password for your extension and of course the WSS URI which probably looks like `wss://domain.com/ws`

Of course, any room name you enter is just an extension in Asterisk. So you'll need to change the input for a select box if you have predefined list of extensions or allow for any room name to be used within your Asterisk Dialplan.


If you want to get a video (and audio) echo of yourself back then you can use the `StreamEcho` Dialplan application - in this example `stream_echo` is what you'd place in the "Join" input box inside Dana.

```
exten => stream_echo,1,Answer()
same = n,StreamEcho(4)
same = n,Hangup()
```

or for an actual video conference you'd use `Confbridge` - in this example `my_video_conference` is the extension name you'd place in the "Join" input box

```
exten = my_video_conference,1,Confbridge(MYCONF,default_bridge,default_user,sample_user_menu)
```

This relies on also having the defaults setup inside `confbridge.conf`, check out the [config sample](https://github.com/asterisk/asterisk/blob/master/configs/samples/confbridge.conf.sample) in the Asterisk source code for those values.

You'll need Asterisk to be able to accept WebRTC connections so follow the guide on the [Asterisk Wiki](https://wiki.asterisk.org/wiki/display/AST/Configuring+Asterisk+for+WebRTC+Clients) to enable that. When setting up your WebRTC extensions you'll also need to set some specific SFU settings on them

```
max_audio_streams=<num>
max_video_streams=<num>
webrtc=yes
```

Adding some text to force a new branch build
