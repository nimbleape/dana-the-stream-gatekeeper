import React, {Fragment} from 'react';
import { withContext } from '../contexts/AppContext';
import { Avatar, Button, TextField, Typography, Container, IconButton } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import {
    Settings as SettingsIcon,
    SettingsInputComponent as SettingsInputComponentIcon,
    LockOutlined as LockOutlinedIcon
} from '@material-ui/icons';
import TopBar from './TopBar';
import Footer from './Footer';

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
}));

function Login(props) {
    const classes = useStyles();

    let { history } = props;
    let roomName = "";

    return (
        <Fragment>
            <TopBar>
                <IconButton edge="end" color="inherit" aria-label="Media Settings"  onClick={() => history.push("/media-settings")}>
                    <SettingsInputComponentIcon />
                </IconButton>
                <IconButton edge="end" color="inherit" aria-label="Settings"  onClick={() => history.push("/settings")}>
                    <SettingsIcon />
                </IconButton>
            </TopBar>
            <Container component="main" maxWidth="xs">
                <div className={classes.paper}>
                    <Typography component="h1" variant="h5">
                        Dana - The Stream Gatekeeper
                    </Typography>
                    <Avatar className={classes.avatar}>
                        <LockOutlinedIcon />
                    </Avatar>
                    <Typography component="h2" variant="h5">
                        Join a Room
                    </Typography>
                    <form className={classes.form} onSubmit={() => history.push(`/video/${roomName}`)}>
                        <TextField
                            variant="outlined"
                            margin="normal"
                            required
                            fullWidth
                            id="roomName"
                            label="Room Name"
                            name="roomName"
                            autoFocus
                            onChange={(event) => {
                                roomName = event.target.value;
                            }}
                        />

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            color="primary"
                            className={classes.submit}
                        >
                            Join
                        </Button>
                    </form>
                </div>
            </Container>
            <Footer />
        </Fragment>
    );
}

export default withContext(Login);