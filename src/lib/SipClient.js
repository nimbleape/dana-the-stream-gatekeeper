import events from 'events';
import jssip from 'jssip';
import Logger from './Logger';
import SipSession from './SipSession';

jssip.debug.enable('JsSIP:*');

const logger = new Logger('SipClient');

export default class SipClient extends events.EventEmitter {
    constructor(settings) {
        logger.debug('constructor() [settings:%o]', settings);

        super();
        this.setMaxListeners(Infinity);

        let socket = new jssip.WebSocketInterface(settings.wsUri);

        // Save given RTCPeerConnection config.
        this._pcConfig = settings.pcConfig;

        // JsSIP.UA instance.
        this._ua = new jssip.UA({
            uri          : settings.sipUri,
            password     : settings.sipPassword,
            display_name : settings.name,
            sockets      : [ socket ],
            register     : false // not going to recieve calls
        });

        this._ua.on('connecting', () => {
            this.emit('connecting');
        });

        this._ua.on('connected', () => {
            this.emit('connected');
        });

        this._ua.on('disconnected', (data) => {
            let error = Boolean(data && data.error);

            this.emit('disconnected', error);
        });

        this._ua.on('newRTCSession', (data) => {
            let rtcSession = data.session;

            this._onSession(rtcSession);
        });

        this._ua.on('newMessage', (data) => {
            if (data.originator === 'local') {
                return;
            }
            let ct = data.request.headers['Content-Type'][0].raw;
            if (ct === 'application/x-asterisk-confbridge-event+json') {
                let msg = JSON.parse(data.request.body);
                if (msg.type === 'ConfbridgeWelcome') {
                    this.emit('participantWelcomeReceived', msg);
                } else {
                    this.emit('participantInfoReceived', msg);
                }
            } else if (ct === 'application/x-asterisk-confbridge-chat+json') {
                let msg = JSON.parse(data.request.body);
                this.emit('messageReceived', msg);
            }
        });

    }

    get name() {
        return this._ua.configuration.display_name;
    }

    get extension() {
        return this._ua.configuration.uri.user;
    }

    get connected () {
        return this._ua.isConnected();
    }

    start() {
        logger.debug('start()');

        this._ua.start();
    }

    stop() {
        logger.debug('stop()');

        this._ua.stop();
    }

    call(number, mediaStream, opts = {}) {
        logger.debug('call() [number:"%s"]', number);

        let constraints = {
            mediaStream      : mediaStream,
            pcConfig         : this._pcConfig,
        };

        if (opts.rtcOfferConstraints) {
            constraints.rtcOfferConstraints = { mandatory: opts.rtcOfferConstraints };
        }

        this._ua.call(number, constraints);
    }

    _onSession(rtcSession) {
        let session = new SipSession(rtcSession);
        this.emit('session', session);
    }
}
