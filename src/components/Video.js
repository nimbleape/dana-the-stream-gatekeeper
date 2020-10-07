import React, { Component } from 'react';
import IconButton from '@material-ui/core/IconButton';
import Chip from '@material-ui/core/Chip';
import { withStyles } from '@material-ui/styles';
import {
    MicOutlined as MicIcon,
    MicOffOutlined as MicOffIcon,
    VideocamOffOutlined as VideoCamOffIcon,
    VideocamOutlined as VideoCamIcon,
    PictureInPicture as PictureInPictureIcon,
    Cancel as CancelIcon,
    Fullscreen as FullscreenIcon
} from '@material-ui/icons';

const styles = theme => ({
    root: {
        position: 'relative',
        borderRadius: '5px'
    },
    selected: {
        borderWidth: '3px',
        borderStyle: 'solid',
        borderColor: theme.palette.secondary.main
    },
    buttons: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        textAlign: 'center',
        zIndex: 100
    },
    name: {
        position: 'absolute',
        top: 0,
        width: '100%',
        textAlign: 'center',
        zIndex: 100
    },
    video: {
        objectFit: 'cover',
        maxWidth: '100%'
    },
    videoPreview: {
        width: '100%'
    },
    myVideoGrid: {
        width: '150px',
        height: '150px'
    },
    videoInGrid: {
        height: '30vh'
    }
});

class Video extends Component {
    constructor(props) {
        super(props)
        this.state = {
            controlsVisible: false,
            audioMuted: false,
            videoMuted: false,
            pipEnabled: false
        };
        this._videoRef = React.createRef();
    }

    _addStreamToVideo() {
        if (this._videoRef.current && this._videoRef.current.srcObject !== this.props.stream && this.props.stream) {

            this._videoRef.current.srcObject = this.props.stream;

            console.log('VIDEO srcObject not set', this.props.stream, this._videoRef);

            this._videoRef.current.onloadedmetadata = () => {
                console.log('VIDEO META DATA LOADED', this._videoRef);
                let tracks = this.props.stream.getVideoTracks();

                for (let i = 0; i < tracks.length; ++i) {
                    console.log('enabling track', tracks[i], this._videoRef);
                    tracks[i].enabled = true;
                }
                console.log('playing video', this._videoRef);
            };

            this._videoRef.current.addEventListener('leavepictureinpicture', (event) => {
                this.setState({pipEnabled: false});
            });

        }
    }

    componentDidMount() {
        this._addStreamToVideo();
    }

    componentDidUpdate() {
        this._addStreamToVideo();
    }

    componentWillUnmount() {
        if (this.state.pipEnabled) {
            this.togglePiP()
        }
    }

    mouseOver() {
        this.setState({controlsVisible: true})
    }

    mouseOut() {
        this.setState({controlsVisible: false})
    }

    toggleVideoMute() {
        this.props.stream.getVideoTracks().forEach((track) => {
            track.enabled = this.state.videoMuted;
        });
        this.setState({videoMuted: !this.state.videoMuted});
    }

    toggleAudioMute() {
        this.props.stream.getAudioTracks().forEach((track) => {
            track.enabled = this.state.audioMuted;
        });
        this.setState({audioMuted: !this.state.audioMuted});
    }

    async togglePiP() {
        console.log('attempting to pip');
        if (this.state.pipEnabled) {
            try {
                await document.exitPictureInPicture();
            } catch(err) {
                console.log('error exiting picture in picture');
            }
        }else {
            try {
                if (this._videoRef.current !== document.pictureInPictureElement) {
                    await this._videoRef.current.requestPictureInPicture();
                    this.setState({pipEnabled: true})
                }
            }
            catch(error) {
                // TODO: Show error message to user.
                console.log('error!', error)
            }
            finally {

            }
        }
    }

    async enableFullscreen() {
        try {
            await this._videoRef.current.requestFullscreen();
        }
        catch(error) {
            // TODO: Show error message to user.
            console.log('error!', error)
        }
        finally {

        }
    }

    render() {

        //should be able to hover over each one and mute it
        let { muted, enableControls, onSelect, stream, selected, classes, inGrid, previewVideo, myStreamGrid, channelData } = this.props;
        let { controlsVisible, audioMuted, videoMuted, pipEnabled } = this.state;

        let selectedClassNames = [classes.root, (selected ? classes.selected : '')].join(' ');

        let videoClassNames = [
            classes.video,
            (inGrid ? classes.videoInGrid : ''),
            (previewVideo ? classes.videoPreview : ''),
            (myStreamGrid ? classes.myVideoGrid : '')
        ].join(' ');

        let hasStreamGotAudioTrack = false;

        if (stream && stream.getAudioTracks().length) {
            hasStreamGotAudioTrack = true;
        }

        console.log('channel data', channelData);

        return (
            <div onClick={() => {
                if (onSelect) {
                    onSelect(stream);
                }
            }} onMouseLeave={this.mouseOut.bind(this)} onMouseEnter={this.mouseOver.bind(this)} className={selectedClassNames}>
                {channelData && channelData.caller && channelData.caller.name && (
                    <span className={classes.name}>
                        <Chip label={channelData.caller.name} color="secondary" />
                    </span>
                )}
                {enableControls && controlsVisible ?
                    <span className={classes.buttons}>
                        {hasStreamGotAudioTrack ?
                            <IconButton edge="end" color="inherit" aria-label="Mic Off"  onClick={this.toggleAudioMute.bind(this)}>
                                {!audioMuted ? <MicIcon /> : <MicOffIcon /> }
                            </IconButton>
                        : null }
                        <IconButton edge="end" color="inherit" aria-label="Video Off"  onClick={this.toggleVideoMute.bind(this)}>
                            {!videoMuted ? <VideoCamIcon /> : <VideoCamOffIcon /> }
                        </IconButton>
                        <IconButton edge="end" color="inherit" aria-label="PiP"  onClick={this.togglePiP.bind(this)}>
                            {!pipEnabled ? <PictureInPictureIcon /> : <CancelIcon />}
                        </IconButton>
                        <IconButton edge="end" color="inherit" aria-label="FullScreen"  onClick={this.enableFullscreen.bind(this)}>
                            <FullscreenIcon />
                        </IconButton>
                    </span>
                : null }

                <video className={videoClassNames} ref={this._videoRef} autoPlay muted={muted}/>

            </div>
        );
    };
}

export default withStyles(styles)(Video);
