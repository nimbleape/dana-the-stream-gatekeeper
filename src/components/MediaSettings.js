import React, {Fragment, useState, useEffect} from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Avatar, IconButton, Button, Typography, Container, InputLabel, MenuItem, FormControl, Select, Grid } from '@material-ui/core';
import { ArrowBack as BackIcon, Videocam as VideocamIcon } from '@material-ui/icons';
import Footer from './Footer';
import TopBar from './TopBar';
import Video from './Video';
import { withContext } from '../contexts/AppContext';


const useStyles = makeStyles(theme => ({
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
    formControl: {
        margin: theme.spacing(1),
        minWidth: 120,
        display: 'flex'
    },
    selectEmpty: {
        marginTop: theme.spacing(2),
    },
}));

async function getMediaDevices() {
    try {
        let devices = await navigator.mediaDevices.enumerateDevices();

        let categorisedDevices = {
            videoinput: new Map(),
            audioinput: new Map(),
            audiooutput: new Map()
        };

        devices.forEach((device) => {
            categorisedDevices[device.kind].set(device.deviceId, device.label);
        });

        return categorisedDevices;
    } catch(err) {
        console.log(err);
    }
}

function devicesList(devicesList) {
    let list = [];
    if (devicesList) {
        devicesList.forEach((deviceName, key) => {
            list.push(<MenuItem value={key} key={key}>{deviceName}</MenuItem>);
        })
        return list;
    } else {
        return <MenuItem>No Devices</MenuItem>
    }
}

function MediaSettings(props) {

    let { dispatch, chosenAudioInput, chosenVideoInput, chosenAudioOutput, history } = props;
    const classes = useStyles();

    const [devices, setDevices] = useState(null);
    const [stream, setStream] = useState(null);

    useEffect(() => {
        async function getDevices() {
            let stream = await navigator.mediaDevices.getUserMedia({audio: true, video: true});
            let devices = await getMediaDevices();
            setDevices(devices);
            setStream(stream);
        }
        getDevices();
    }, []);

    useEffect(() => {
        async function getStream() {
            let constraints = {
                audio: true,
                video: {
                    width: { min: 640, ideal: 1920, max: 3840 },
                    height: { min: 400, ideal: 1080, max: 2160 },
                    aspectRatio: { ideal: 1.7777777778 }
                }
            }
            if (chosenAudioInput) {
                constraints.audio = {
                    deviceId: { exact: chosenAudioInput }
                }
            }

            if (chosenVideoInput) {
                constraints.video.deviceId = { exact: chosenVideoInput };
            }

            let stream = await navigator.mediaDevices.getUserMedia(constraints);
            setStream(stream);
        }
        getStream();
    }, [chosenAudioInput, chosenVideoInput]);

    useEffect(() => {
        return function cleanup() {
            if(stream && stream.getTracks) {
                stream.getTracks().forEach((track) => {
                    track.stop();
                });
            }
        }
    }, [stream]);

    const handleChange = (event) => {
        let ACTION_NAME;
        switch(event.target.name) {
            case 'audioinput':
                ACTION_NAME = 'UPDATE_CHOSEN_MIC';
                break;
            case 'videoinput':
                ACTION_NAME = 'UPDATE_CHOSEN_CAMERA';
                break;
            case 'audiooutput':
                ACTION_NAME = 'UPDATE_CHOSEN_OUTPUT';
                break;
            default:
                break;
        }
        dispatch({ type: ACTION_NAME, deviceId: event.target.value});
    };

    return (
        <Fragment>
            <TopBar>
                <IconButton edge='end' color='inherit' aria-label='Settings'  onClick={() => history.goBack()}>
                    <BackIcon />
                </IconButton>
            </TopBar>
            <Container maxWidth='lg'>
                <div className={classes.paper}>
                    <Avatar className={classes.avatar}>
                        <VideocamIcon />
                    </Avatar>
                    <Typography component='h1' variant='h5'>
                        Media Settings
                    </Typography>
                </div>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <form className={classes.form} noValidate onSubmit={() => {
                            history.push('/');
                        }}>
                            <FormControl className={classes.formControl}>
                                <InputLabel id='audio-input-select-label'>Audio</InputLabel>
                                <Select
                                    labelId='audio-input-select-label'
                                    id='audioInputSelect'
                                    name="audioinput"
                                    autoWidth
                                    value={chosenAudioInput}
                                    onChange={handleChange}
                                >
                                    {devicesList(devices && devices.audioinput)}
                                </Select>
                            </FormControl>

                            <FormControl className={classes.formControl}>
                                <InputLabel id='video-input-select-label'>Video</InputLabel>
                                <Select
                                    labelId='video-input-select-label'
                                    id='videoInputSelect'
                                    name="videoinput"
                                    autoWidth
                                    value={chosenVideoInput}
                                    onChange={handleChange}
                                >
                                    {devicesList(devices && devices.videoinput)}
                                </Select>
                            </FormControl>

                            {/* <FormControl className={classes.formControl}>
                                <InputLabel id='audio-output-select-label'>Audio Output</InputLabel>
                                <Select
                                    labelId='audio-output-select-label'
                                    id='audioOutputSelect'
                                    name="audiooutput"
                                    autoWidth
                                    value={chosenAudioOutput}
                                    onChange={handleChange}
                                >
                                    {devicesList(devices && devices.audiooutput)}
                                </Select>
                            </FormControl> */}

                            <Button
                                type='submit'
                                fullWidth
                                variant='contained'
                                color='primary'
                                className={classes.submit}

                            >
                                Finished
                            </Button>
                        </form>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Video stream={stream} muted={true} />
                    </Grid>
                </Grid>
            </Container>
            <Footer />
        </Fragment>
    );
}

export default withContext(MediaSettings);