import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Typography, Container, Link } from '@material-ui/core';
import { Favorite as FavouriteIcon } from '@material-ui/icons';

const useStyles = makeStyles(theme => ({
    footer: {
        padding: theme.spacing(2),
        marginTop: 'auto',
    },
    heart: {
        color: theme.palette.secondary.main
    }
}));

export default function Login() {
    const classes = useStyles();

    return (
        <footer className={classes.footer}>
            <Container maxWidth="sm">
                <Typography variant="body2" color="textSecondary" align="center">
                    {'Made with '}
                        <FavouriteIcon className={classes.heart} />
                    {' by '}
                    <Link color="inherit" href="https://nimblea.pe">
                        Nimble Ape Ltd
                    </Link>
                </Typography>
            </Container>
        </footer>
    );
}