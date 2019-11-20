import React, {Component} from 'react';
import IconButton from '@material-ui/core/IconButton';
import { withStyles } from '@material-ui/styles';
import {
    MicOutlined as MicIcon,
    MicOffOutlined as MicOffIcon,
    VideocamOffOutlined as VideoCamOffIcon,
    VideocamOutlined as VideoCamIcon
} from '@material-ui/icons';

const styles = theme => ({
    root: {
        position: 'relative',
        borderRadius: '2px'
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
    video: {
        objectFit: 'cover'
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
            videoMuted: false
        }
        this._videoRef = React.createRef()
    }

    _addStreamToVideo() {
        if (this._videoRef.current.srcObject !== this.props.stream) {
            this._videoRef.current.autoplay = true;
            this._videoRef.current.srcObject = this.props.stream;
            this._videoRef.current.onloadedmetadata = () => {
                let tracks = this.props.stream.getVideoTracks();
                for (let i = 0; i < tracks.length; ++i) {
                    tracks[i].enabled = true;
                }
            };
        }
    }

    componentDidMount() {
        this._addStreamToVideo();
    }

    componentDidUpdate() {
        this._addStreamToVideo();
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

    render() {

        //should be able to hover over each one and mute it
        let { muted, enableControls, onSelect, stream, selected, classes, inGrid } = this.props;
        let { controlsVisible, audioMuted, videoMuted } = this.state;

        let selectedClassNames = [classes.root, (selected ? classes.selected : '')].join(' ');
        let videoClassNames = [classes.video, (inGrid ? classes.videoInGrid : '')].join(' ');

        let hasStreamGotAudioTrack = false;
        if (stream && stream.getAudioTracks().length) {
            hasStreamGotAudioTrack = true;
        }

        return (
            <div onClick={() => {
                if (onSelect) {
                    onSelect(stream);
                }
            }} onMouseLeave={this.mouseOut.bind(this)} onMouseEnter={this.mouseOver.bind(this)} className={selectedClassNames}>
                {enableControls && controlsVisible ?
                    <span className={classes.buttons}>
                        {!muted && hasStreamGotAudioTrack ?
                            <IconButton edge="end" color="inherit" aria-label="Mic Off"  onClick={this.toggleAudioMute.bind(this)}>
                                {!audioMuted ? <MicIcon /> : <MicOffIcon /> }
                            </IconButton>
                        : null }
                        <IconButton edge="end" color="inherit" aria-label="Video Off"  onClick={this.toggleVideoMute.bind(this)}>
                            {!videoMuted ? <VideoCamIcon /> : <VideoCamOffIcon /> }
                        </IconButton>
                    </span>
                : null }
                <video className={videoClassNames} height={this.props.height} width={this.props.width} ref={this._videoRef} muted={muted}/>
            </div>
        );
    };
}

export default withStyles(styles)(Video);
