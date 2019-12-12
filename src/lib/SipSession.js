import events from 'events';
import jssip from 'jssip';
import Logger from './Logger';
import uuidv4 from 'uuid/v4';

const logger = new Logger('SipSession');

export default class SipSession extends events.EventEmitter {
	constructor(rtcSession) {
		logger.debug('constructor()');

		super();
		this.setMaxListeners(Infinity);

		this._type = rtcSession.data.type;

		// Random unique id.
		this._id = uuidv4();

		// When the call starts.
		this._startTime = new Date();

		// Call status: 'init' / 'ringing' / 'answered' / 'failed' / 'ended'.
		this._status = 'init';

		// Whether this call is the active one.
		this._active = false;

		// End cause.
		this._endInfo = {
			originator  : null,
			cause       : null
		};

		// Muted status
		this._muted = false;

		// JsSIP.RTCSession instance.
		this._rtcSession = rtcSession;

		let _attachPCListeners = (pc) => {
			window.pc = pc;

			/**
			 * Technically theres one media stream with multiple tracks, one audio and X video
			 */

			pc.ontrack = (event) => {

				if (event.track.kind === 'video') {
					event.track.enabled = false;
				}

				event.streams.forEach((stream) => {
					//check to make sure the stream actually has tracks....
					console.log('YO', event);
					this.emit('newStream', stream);
				});
			};

			//rtc.connection.onremovestream = function (event) {


			pc.onremovetrack = (event) => {
				console.log('track removed', event);
				this.emit('streamRemoved', event.stream);
			};
		};

		if (this._rtcSession._connection) {
			_attachPCListeners(this._rtcSession._connection);
		}
		else {
			this._rtcSession.on('peerconnection', (data) => {
				let pc = data.peerconnection;
				_attachPCListeners(pc);
			});
		}

		this._rtcSession.on('accepted', () => {
			this._status = 'answered';
			this.emit('change');

			this.emit('answer');
		});

		this._rtcSession.on('failed', (data) => {
			let { originator, cause } = data;

			this._endInfo = {
				originator  : originator,
				cause       : cause,
			};

			this._status = 'failed';
			this.emit('change');

			this.emit('terminate', this._endInfo);
		});

		this._rtcSession.on('ended', (data) => {
			let { originator, cause } = data;

			this._endInfo = {
				originator  : originator,
				cause       : cause,
			};

			this._status = 'ended';
			this.emit('change');

			this.emit('terminate', this._endInfo);
		});

		this._rtcSession.on('muted', () => {
			this._muted = true;
			this.emit('change');
		});

		this._rtcSession.on('unmuted', () => {
			this._muted = false;
			this.emit('change');
		});

		let candidateTypes = {
			host: 0,
			srflx: 0,
			relay: 0
		};

		this._rtcSession.on('icecandidate', (evt) => {
			// asterisk doesnt support trickel ice, so we want to complete our ice gathering asap
			let type = evt.candidate.candidate.split(' ');
			candidateTypes[type[7]]++;
			if (candidateTypes['srflx'] >= 1) {
				evt.ready();
			}
		})
	}

	get jssipRtcSession() {
		return this._rtcSession;
	}

	get id() {
		return this._id;
	}

	get status() {
		return this._status;
	}

	get disposition() {
		let causes = jssip.C.causes;
		let cause = this._endInfo.cause;

		switch (this._status) {
			case 'failed': {
				switch (cause) {
					case causes.CANCELED:
					case causes.NO_ANSWER:
					case causes.EXPIRES:
						return 'missed';
					default:
						return 'rejected';
				}
			}

			case 'ended': {
				return 'answered';
			}

			default:
				throw new Error('cannot get call disposition while not terminated');
		}
	}

	get answered() {
		return this._status === 'answered';
	}

	get terminated() {
		return this._status === 'failed' || this._status === 'ended';
	}

	get endInfo() {
		return this._endInfo;
	}

	get startTime() {
		return this._startTime;
	}

	get answerTime() {
		return this._rtcSession.start_time;
	}

	get duration() {
		if (!this.answerTime) {
			return 0;
		}

		let now = new Date();

		return Math.floor((now - this.answerTime) / 1000);
	}

	get muted() {
		return this._muted;
	}

	get type() {
		return this._type;
	}

	terminate(sipCode, sipReason) {
		if (!this.terminated) {
			this._rtcSession.terminate({
				status_code   : sipCode,
				reason_phrase : sipReason
			});
		}
	}

	mute() {
		this._rtcSession.mute({ audio: true, video: true });
	}

	unmute() {
		this._rtcSession.unmute({ audio: true, video: true });
	}
}
