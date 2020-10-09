import React, { Component, Fragment } from 'react';
import { withStyles } from '@material-ui/styles';
import { withContext } from '../contexts/AppContext';
import SipClient from '../lib/SipClient';
import mqtt from 'async-mqtt';
import Video from './Video';
import TopBar from './TopBar';
import { Beforeunload } from 'react-beforeunload';
import clsx from 'clsx';
import ScrollableFeed from 'react-scrollable-feed';

import {
    Avatar,
    Button,
    Typography,
    Container,
    Grid,
    Drawer,
    Snackbar,
    IconButton,
    List,
    ListItemText,
    ListItem,
    TextField,
    Tooltip
} from '@material-ui/core';

import {
    ArrowBack as BackIcon,
    Videocam as VideoCamIcon,
    ScreenShare as ScreenShareIcon,
    StopScreenShare as StopScreenShareIcon,
    Error as ErrorIcon,
    Close as CloseIcon,
    Mic as MicIcon,
    MicOff as MicOffIcon,
    Forum as ForumIcon,
    SpeakerNotes as ChatIcon,
    SpeakerNotesOff as ChatOffIcon
} from '@material-ui/icons';

const drawerWidth = 240;

const styles = theme => ({
    paper: {
        marginTop: theme.spacing(8),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    avatar: {
        margin: theme.spacing(1),
        backgroundColor: theme.palette.secondary.main,
    },
    form: {
        width: '100%', // Fix IE 11 issue.
        marginTop: theme.spacing(1),
    },
    submit: {
        margin: theme.spacing(3, 0, 2),
    },
    root: {
        overflow: 'hidden',
        minHeight: '100vh',
    },
    bottomRow: {
        position: 'absolute',
        height: '200px',
        bottom: 0,
        left: 0,
        right: 0,
        overflow: 'hidden',
        paddingRight: '15px'
    },
    errorMessage: {
        display: 'flex',
        alignItems: 'center',
    },
    errorIcon: {
        fontSize: 20,
        opacity: 0.9,
        marginRight: theme.spacing(1),
    },
    drawerList: {
        width: `${drawerWidth}px`
    },
    videoGrid: {
        maxHeight: `calc(100vh - 56px)`,
        minHeight: `calc(100vh - 56px)`
    },
    rootShiftRight: {
        paddingRight: drawerWidth
    },
    rootShiftLeft: {
        paddingLeft: drawerWidth
    }
});


class VideoRoom extends Component {
    constructor(props) {
        super(props);

        this.state = {
            localStreams: new Map(),
            streams: new Map(),
            connect: false,
            selectedStream: null,
            session: null,
            screensharing: false,
            snackOpen: false,
            transcriptionDrawerOpen: false,
            chatDrawerOpen: false,
            errorMessage: '',
            onSnackCloseAction: null,
            remoteAudioStream: null,
            remoteAudioMuted: false,
            transcription: new Map(),
            chat: new Set(),
            participantList: new Map(),
            streamGridSizes: null
        };

        this._streamsContainerRef = React.createRef();

        try {
            this._sip = new SipClient({
                name             : props.name,
                sipUri           : props.sipUri,
                sipPassword      : props.password,
                wsUri            : props.serverWssUri,
                pcConfig         : {
                    iceServers: [
                        {
                            urls: [ 'stun:stun.l.google.com:19302']
                        }
                    ]
                }
            });

            if (props.mqttUri) {
                this._connectToMqtt(props.mqttUri);
            }

        } catch(err) {
            this.setState({ snackOpen: true, errorMessage: err.message });
        }

        window.addEventListener('resize', this._windowResized.bind(this));
    }

    _windowResized() {
        if (this._streamsContainerRef && this._streamsContainerRef.current) {
            let size = this._streamsContainerRef.current.getBoundingClientRect();
            this.setState({
                streamGridSizes: {
                    height: size.height,
                    width: size.width,
                    area: size.height * size.height
                }
            })
        }
    }

    async _connectToMqtt(mqttUri) {
        console.log('connecting to mqtt');
        try {
            this._mqtt = await mqtt.connectAsync(mqttUri);
            console.log('connected to mqtt?', this._mqtt);
            this._mqtt.on('message', this._handleMqttMessage.bind(this));
        } catch (err) {
            console.log('error connecting to mqtt', err);
        }
    }

    async getScreenShareMedia() {
        let stream;
        try {
            stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    cursor: 'always'
                },
                audio: false
            });

            let track = stream.getVideoTracks()[0];
            track.contentHint = 'detail';

            this.setState((prevState) => {
                let localStreams = prevState.localStreams;

                //find the previous one and delete it
                localStreams.delete('screen-share');

                localStreams.set('screen-share', stream);
                return {
                    ...prevState,
                    localStreams
                }
            });

            track.onended = () => {
                this._stopScreenShare();
            };
        } catch(err) {
            this.setState({ snackOpen: true, errorMessage: err.message });
        }

        return stream;
    }

    async getStream() {

        let devices = await navigator.mediaDevices.enumerateDevices();
        let { chosenAudioInput, chosenVideoInput } = this.props;

        //if we can support 4k then we should
        let constraints = {
            audio: true,
            video: {
                width: { min: 640, ideal: 1920, max: 3840 },
                height: { min: 400, ideal: 1080, max: 2160 },
                aspectRatio: { ideal: 1.7777777778 }
            }
        }
        if (chosenAudioInput) {

            //do we have it?
            let found = devices.some((device) => {
                console.log(device, chosenAudioInput);
                return device.deviceId === chosenAudioInput;
            })
            if (found) {
                constraints.audio = {
                    deviceId: { exact: chosenAudioInput }
                }
            }
        }

        if (chosenVideoInput) {
            //do we have it?
            let found = devices.some((device) => {
                console.log(device, chosenVideoInput);

                return device.deviceId === chosenVideoInput;
            })
            if (found) {
                constraints.video.deviceId = { exact: chosenVideoInput };
            }
        }

        let stream;
        try {
            stream = await navigator.mediaDevices.getUserMedia(constraints);

            this.setState((prevState) => {
                let localStreams = prevState.localStreams;

                //find the previous one and delete it
                localStreams.delete('local-camera');
                localStreams.set('local-camera', stream);
                return {
                    ...prevState,
                    localStreams
                }
            });
        } catch (err) {
            this.setState({ snackOpen: true, errorMessage: err.message });
        }

        return stream;
    }

    handleSession (session) {
        this.setState({ session });

        session.on('newTrack', (evt) => {
            let { participantList } = this.state;
            let stream = evt.streams[0];

            console.log(evt);

            //this shouldnt be needed but alas I still get a video track with the audio track...
            if (this.state.streams.has(stream.id) || (this.state.remoteAudioStream && this.state.remoteAudioStream.id === stream.id)) {
                return;
            }

            let track = evt.track;

            track.addEventListener('ended', () => {
                this.setState((prevState) => {
                    let streams = prevState.streams;
                    streams.delete(stream.id);
                    return {
                        ...prevState,
                        streams
                    }
                });
            })

            //theres only one audio track from asterisk
            if (track.kind === 'audio') {
                console.log('got a stream with audio track', stream);
                this.setState({remoteAudioStream: stream});
                this._remoteAudio = new Audio();
                this._remoteAudio.srcObject = this.state.remoteAudioStream;
                this._remoteAudio.play();
            } else {

                console.log('non audio track', track.kind);

                if (!this.state.streams.has(stream.id)) {

                    let foundChannel = null;
                    Array.from(participantList.values()).some((participant) => {
                        if (participant.msids && participant.msids.includes(track.id)) {
                            foundChannel = participant;
                            return true;
                        }
                        return false;
                    })
                    let component = (<Video key={stream.id} channelData={foundChannel} stream={stream} muted={false} enableControls={true} inGrid={true}/>)

                    this.setState((prevState) => {
                        let streams = prevState.streams;
                        streams.set(stream.id, component);
                        return {
                            ...prevState,
                            streams
                        }
                    });
                }
            }
        });

        session.on('terminate', (endInfo) => {
            if (session.status === 'failed') {
                this.setState({
                    snackOpen: true,
                    errorMessage: endInfo.cause,
                    onSnackCloseAction: () => {
                        this.props.history.push('/');
                    }
                });

            }
        })

        session.on('participantLabelsUpdate', (ids) => {
            //go find the list of participants and update it with a list of the msids
            this._participantIds = ids;
        })

        this._sip.on('participantWelcomeReceived', (msg) => {
            console.log('participant welcome', msg)
            this._setChannelInfoFromMessage(msg);
        })

        this._sip.on('participantInfoReceived', (msg) => {
            console.log('participant info', msg)
            this._setChannelInfoFromMessage(msg);
        });

        this._sip.on('messageReceived', (msg) => {
            console.log('got a message', msg);
            let {chat} = this.state;
            chat.add({name: msg.From, text: msg.Body});
            this.setState({ chat });
        })
    }

    _setChannelInfoFromMessage(msg) {
        let participants = new Map();
        console.log('IDS', this._participantIds);
        msg.channels.forEach((channel) => {
            participants.set(channel.id, {...channel, msids: this._participantIds.get(channel.id/1)})
        });

        this.setState({participantList: participants});
    }

    _handleMqttMessage(topic, message) {
        if (topic.includes('transcript')) {
            console.log('got a message', message.toString());
            let {transcription} = this.state;
            let msg = JSON.parse(message);
            console.log(msg);
            transcription.delete(msg.id);
            transcription.set(msg.id, msg);

            this.setState({ transcription });
        }
    }

    _setMute(type, stream, state) {
        console.log('setMute');
        stream[`get${type}Tracks`]().forEach((track) => {
            console.log(state ? 'muting' : 'unmuting', track);
            track.enabled = !state;
            console.log(state ? 'muting' : 'unmuting', track);
        });
    }

    async _call() {
        const { match } = this.props;
        this.setState({connect: true});
        if (match.params.name) {
            this._sip.on('connected', () => {
                this._sip.call(match.params.name, this.state.localStreams.get('local-camera'));

                //make a new map with 30 video components in it
                //let videoMap = new Map();
                // for (let i = 0; i < 1; i++) {
                //     videoMap.set(i, <Video key={i} muted={false} enableControls={true} inGrid={true}/>)
                // }
                //this.setState({streams: videoMap});
            });
            if (this._mqtt) {
                try {
                    let result = this._mqtt.subscribe(`danatsg/${match.params.name}/transcription`);
                    console.log('subscription was ', result);
                } catch(err) {
                    console.log('ERR', err);
                }
            }
        }
        this._sip.start();
    }

    _sendChat(e) {
        e.preventDefault();
        e.stopPropagation();
        let { session } = this.state;
        console.log(this.textChatRef.value);
        if (session) {
            session.sendMessage(this._sip.name, this.textChatRef.value);
            let {chat} = this.state;
            chat.add({name: this._sip.name, text: this.textChatRef.value});
            this.setState({ chat });
        }
        this.textChatRef.value = '';
    }

    tearDownLocalStreams() {
        let { localStreams } = this.state;
        if (localStreams) {
            localStreams.forEach((stream) => {
                stream.getTracks().forEach((track) => {
                    track.stop();
                });
            });

            this.setState((prevState) => {
                let localStreams = prevState.localStreams;

                localStreams.clear();
                return {
                    ...prevState,
                    localStreams
                }
            });
        }
    }

    async componentDidMount () {
        await this.getStream();
        this._boundOnSession = this.handleSession.bind(this);
        this._sip.on('session', this._boundOnSession);
    }

    componentDidUpdate(prevProps) {
        if (prevProps.chosenAudioInput !== this.props.chosenAudioInput || prevProps.chosenVideoInput !== this.props.chosenVideoInput) {
            this.getStream();
        }

        if (this._streamsContainerRef && this._streamsContainerRef.current && !this.state.streamGridSizes) {
            this._windowResized();
        }
    }

    _terminate() {
        this.state.session && this.state.session.terminate();
    }

    componentWillUnmount() {
        this._sip.removeAllListeners('session');
        this._sip.removeAllListeners('participantWelcomeReceived');
        this._sip.removeAllListeners('participantInfoReceived');
        this._sip.removeAllListeners('messageReceived');
        if (this.state.session) {
            this.state.session.terminate();
        }
        this._sip.stop();
        if (this._mqtt) {
            this._mqtt.end();
        }
        this.tearDownLocalStreams();
    }

    _renderConnectModal() {
        const { classes, history } = this.props;
        const { localStreams } = this.state;

        return (
            <Fragment>
                <TopBar>
                    <IconButton edge='end' color='inherit' aria-label='Back'  onClick={() => history.push('/')}>
                        <BackIcon />
                    </IconButton>
                </TopBar>
                <Container component="main" maxWidth="xs">
                    <div className={classes.paper}>
                        <Avatar className={classes.avatar}>
                            <VideoCamIcon />
                        </Avatar>
                        <Typography component="h1" variant="h5">
                            Do you look spiffing?
                        </Typography>
                        <Video stream={localStreams.get('local-camera')} previewVideo={true} enableControls={true} muted={true}/>
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            color="primary"
                            className={classes.submit}
                            onClick={this._call.bind(this)}
                        >
                            Yes, Yes I do
                        </Button>
                    </div>
                </Container>
            </Fragment>
        );
    }

    async _startScreenShare() {
        const { match } = this.props;
        const { session } = this.state;
        if (match.params.name) {
            //go add the screen share track (from the screenShareStream) into the localStream
            let screenShareStream = await this.getScreenShareMedia();

            this._screenshareTransceiver = session.jssipRtcSession.connection.addTransceiver(screenShareStream.getVideoTracks()[0], {direction: 'sendonly', streams: [screenShareStream]});

            if(session.jssipRtcSession.renegotiate()) {
                console.log('renegotiating adding screenshare');
            }
            this.setState({screensharing: true});
        }
    }

    _stopScreenShare() {
        const { session } = this.state;

        this._screenshareTransceiver && this._screenshareTransceiver.stop();

        let screenShareStream = this.state.localStreams.get('screen-share');
        if (screenShareStream) {

            screenShareStream.getTracks().forEach((track) => {
                track.stop();
            })

            this.setState((prevState) => {
                let localStreams = prevState.localStreams;

                localStreams.delete('screen-share');
                return {
                    ...prevState,
                    localStreams
                }
            });
        }

        if(session.jssipRtcSession.renegotiate()) {
            console.log('renegotiating removal of screen share');
        }

        this.setState({screensharing: false});
    }

    selectedStream(stream) {
        this.setState({selectedStream: stream});
    }

    _renderStreams(streamsIterator, number, bigGrid = false) {
        let height, width;
        console.log(number);
        if (bigGrid && this.state.streamGridSizes) {
            if ( number > 1) {
                console.log('working out the right square sizes')
                height = width = Math.sqrt((this.state.streamGridSizes.area / number));
            } else if (number === 1) {
                console.log('only one');
                height = this.state.streamGridSizes.height;
                width = this.state.streamGridSizes.width;
            }
        }

        let streamComponents = [];
        for (let i = 0; i < number; i++) {
            let videoComponent = streamsIterator.next().value;
            streamComponents.push(<Grid item key={i} style={{height, width}}>{videoComponent}</Grid>);
        }
        return streamComponents;
    }

    _renderStreamsContainer(streams) {

        let { classes } = this.props;

        let numToRender = streams.size;

        let streamsValue = streams.values();
        return (<Grid
            className={classes.videoGrid}
            container
            xl={false}
            lg={false}
            md={false}
            sm={false}
            xs={false}
            direction="row"
            justify="center"
            alignItems="center"
            spacing={2}
            ref={this._streamsContainerRef}
        >
            {this._renderStreams(streamsValue, numToRender, true)}
        </Grid>);
    }

    _getTranscriptionListComponent() {
        let items = [];
        (new Map([...this.state.transcription].reverse())).forEach((transcription, index) => {
            let transText = '';
            if (transcription.platform === 'azure') {
                transText = transcription.results.text;
            } else if (transcription.platform === 'google') {
                transText = transcription.results.alternatives[0].transcript;
            } else if (transcription.platform === 'amazon') {
                transText = transcription.results[0].Transcript;
            }
            items.push(
                <ListItem divider={true} alignItems="flex-start" key={transcription.id}>
                    <ListItemText
                        primary={`${transcription.callerName} (${transcription.platform})`}
                        secondary={transText}
                    />
                </ListItem>
            );
        });
        return items;
    }

    _getChatListComponent() {
        return Array.from(this.state.chat).map((chat, i) => (
            <ListItem divider={true} alignItems="flex-start">
                <ListItemText
                    primary={chat.name}
                    secondary={chat.text}
                />
            </ListItem>
        ));
    }

    _handleSnackClose(event, reason) {
        if (reason === 'clickaway') {
          return;
        }

        let onSnackCloseAction = this.state.onSnackCloseAction;
        this.setState({snackOpen: false, errorMessage: '', onSnackCloseAction: null});
        if (onSnackCloseAction) {
            onSnackCloseAction();
        }
    };

    _toggleRemoteAudio() {
        if (this.state.remoteAudioStream) {
            this.state.remoteAudioStream.getAudioTracks().forEach((track) => {
                track.enabled = this.state.remoteAudioMuted;
            });
            this.setState({remoteAudioMuted: !this.state.remoteAudioMuted});
        }
    }

    render() {
        let { localStreams, streams, connect, screensharing, snackOpen, errorMessage, remoteAudioMuted, transcriptionDrawerOpen, chatDrawerOpen } = this.state;
        let { classes, history, mqttUri }  = this.props;

        if (!connect) {
            return this._renderConnectModal();
        }

        let streamContainerMap = new Map();

        localStreams.forEach((stream) => {
            streamContainerMap.set(stream.id, <Video key={stream.id} stream={stream} myStreamGrid={true} enableControls={true} muted={true}/>);
        });

        let localStreamsValue = streamContainerMap.values();

        console.log(this.state.streamGridSizes)

        return (
            <Beforeunload onBeforeunload={this._terminate.bind(this)}>
                <div className={clsx(classes.root, {
                    [classes.rootShiftLeft]: chatDrawerOpen,
                    [classes.rootShiftRight]: transcriptionDrawerOpen,
                })}>
                    <TopBar>
                        { remoteAudioMuted ?
                            <Tooltip title="Un-mute Remote Audio">
                                <IconButton edge='end' color='inherit' aria-label='Un-mmute Remote Audio'  onClick={this._toggleRemoteAudio.bind(this)}>
                                    <MicOffIcon />
                                </IconButton>
                            </Tooltip>
                        :
                            <Tooltip title="Mute Remote Audio">
                                <IconButton edge='end' color='inherit' aria-label='Mute Remote Audio'  onClick={this._toggleRemoteAudio.bind(this)}>
                                    <MicIcon />
                                </IconButton>
                            </Tooltip>
                        }
                        { screensharing ?
                            <Tooltip title="Stop Screen Share">
                                <IconButton edge='end' color='inherit' aria-label='Stop Screen Share'  onClick={this._stopScreenShare.bind(this)}>
                                    <StopScreenShareIcon />
                                </IconButton>
                            </Tooltip>
                        :
                            <Tooltip title="Start Screen Share">
                                <IconButton edge='end' color='inherit' aria-label='Screen Share'  onClick={this._startScreenShare.bind(this)}>
                                    <ScreenShareIcon />
                                </IconButton>
                            </Tooltip>
                        }
                        <Tooltip title="Toggle Chat">
                            <IconButton edge='end' color='inherit' aria-label='Chat'  onClick={() => this.setState({chatDrawerOpen: !this.state.chatDrawerOpen})}>
                                <ChatIcon />
                            </IconButton>
                        </Tooltip>
                        { mqttUri && (
                            <Tooltip title="Toggle Transcription">
                                <IconButton edge='end' color='inherit' aria-label='Transcription'  onClick={() => this.setState({transcriptionDrawerOpen: !this.state.transcriptionDrawerOpen})}>
                                    <ForumIcon />
                                </IconButton>
                            </Tooltip>
                        )}
                        <Tooltip title="Leave">
                            <IconButton edge='end' color='inherit' aria-label='Back'  onClick={() => history.push('/')}>
                                <BackIcon />
                            </IconButton>
                        </Tooltip>
                    </TopBar>

                    {this._renderStreamsContainer(streams)}

                    <Grid
                        container
                        direction="row"
                        justify="flex-end"
                        alignItems="center"
                        className={classes.bottomRow}
                    >
                        {this._renderStreams(localStreamsValue, localStreams.size)}
                    </Grid>
                    <Drawer
                        anchor="left"
                        variant="persistent"
                        open={this.state.chatDrawerOpen}
                        onClose={() => this.setState({chatDrawerOpen: !this.state.chatDrawerOpen})}
                    >
                        <ScrollableFeed>
                            {this._getChatListComponent()}
                        </ScrollableFeed>
                        { this.state.session && this.state.session.jssipRtcSession && (
                            <form onSubmit={this._sendChat.bind(this)} noValidate autoComplete="off">
                                <TextField
                                    id="chat"
                                    label="Chat"
                                    fullWidth
                                    rows={4}
                                    inputRef={(c) => {this.textChatRef = c}}
                                />
                                <Button
                                    type="submit"
                                    fullWidth
                                    variant="contained"
                                    color="primary"
                                    className={classes.submit}
                                >
                                    Send
                                </Button>
                            </form>
                        )}
                    </Drawer>
                    <Drawer
                        anchor="right"
                        variant="persistent"
                        open={this.state.transcriptionDrawerOpen}
                        onClose={() => this.setState({transcriptionDrawerOpen: !this.state.transcriptionDrawerOpen})}
                    >
                        <List className={classes.drawerList}>
                            {this._getTranscriptionListComponent()}
                        </List>
                    </Drawer>
                    <Snackbar
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                        open={snackOpen}
                        autoHideDuration={6000}
                        onClose={this._handleSnackClose.bind(this)}
                        ContentProps={{
                            'aria-describedby': 'message-id',
                        }}
                        message={<span id='message-id' className={classes.errorMessage}><ErrorIcon className={classes.errorIcon}/>{errorMessage}</span>}
                        action={[
                            <IconButton
                                key="close"
                                aria-label="close"
                                color="inherit"
                                className={classes.close}
                                onClick={this._handleSnackClose.bind(this)}
                            >
                                <CloseIcon />
                            </IconButton>,
                        ]}
                    />
                </div>
            </Beforeunload>
        );
    }
}

export default withStyles(styles)(withContext(VideoRoom));