import { Button, Card, CardActions, CardContent, CardHeader, CircularProgress, Grid, IconButton, SvgIcon, SvgIconProps, TextField } from "@material-ui/core";
import CheckIcon from '@material-ui/icons/Check';
import ErrorOutlineIcon from '@material-ui/icons/ErrorOutline';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import PauseCircleFilledIcon from '@material-ui/icons/PauseCircleFilled';
import PlayCircleFilledIcon from '@material-ui/icons/PlayCircleFilled';
import { ipcRenderer, shell } from 'electron';
import { capitalize, uniqueId } from "lodash";
import React, { useEffect, useRef, useState } from "react";
import { SampleStore } from "../index";
import { PlayerStats } from "../rest-client/rest-client";
import { useStyles } from "./ControlPanel.style";
import ElectronStore = require('electron-store');
import moment from "moment";

type Props = {}

const store = new ElectronStore<SampleStore>();


function TwitchIcon(props: SvgIconProps) {
    return (
        <SvgIcon {...props}>
            <path d="M2.149 0l-1.612 4.119v16.836h5.731v3.045h3.224l3.045-3.045h4.657l6.269-6.269v-14.686h-21.314zm19.164 13.612l-3.582 3.582h-5.731l-3.045 3.045v-3.045h-4.836v-15.045h17.194v11.463zm-3.582-7.343v6.262h-2.149v-6.262h2.149zm-5.731 0v6.262h-2.149v-6.262h2.149z" />
        </SvgIcon>
    );
}

export const ControlPanel: React.FC<Props> = () => {
    const classes = useStyles();
    const [channel, setChannel] = useState<string>(store.get('channel') || '');
    const [logs, setLogs] = useState<PlayerStats[]>([]);
    const [command, setCommand] = useState<string>(store.get('command') || '!stats');
    const [ocpKey, setOcpKey] = useState<string>(store.get('ocpKey') || '');
    const [isOpcKeyValid, setIsOpcKeyValid] = useState<boolean>(true);
    const [botState, setBotState] = useState<'connected' | 'disconnected' | 'loading'>('disconnected');
    const lastLogRef = useRef(null);

    const validateOprKey = () => {
        if (ocpKey !== '') {
            setIsOpcKeyValid(ipcRenderer.sendSync('validate-ocp-key', ocpKey));
        } else {
            setIsOpcKeyValid(false);
        }
        store.set('ocpKey', ocpKey);
    };

    useEffect(() => {
        ipcRenderer.removeAllListeners('stats');
        ipcRenderer.removeAllListeners('bot-connection');
        ipcRenderer.on('stats', (_event, entry) => {
            setLogs((old) => [...old, entry]);
        });

        ipcRenderer.on('bot-connection', (_event, connected) => {
            setBotState(connected ? 'connected' : 'disconnected');
        });
        validateOprKey();
    }, []);

    useEffect(() => {
        if (!!logs.length && lastLogRef.current) {
            lastLogRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs]);

    let botIcon: JSX.Element = null;
    let handleBotAction: () => void = () => { };

    switch (botState) {
        case 'connected':
            botIcon = <PauseCircleFilledIcon htmlColor='red' />;
            handleBotAction = () => {
                ipcRenderer.send('bot-disconnect');
                setBotState('loading');
            }
            break;
        case 'disconnected':
            botIcon = <PlayCircleFilledIcon htmlColor='green' />;
            handleBotAction = () => {
                ipcRenderer.send('bot-connect');
                setBotState('loading');
            }
            break;
        case 'loading':
            botIcon = <CircularProgress size={20} />;
            break;
        default:
            break;
    }

    return (
        <div className={classes.root}>
            <Grid container spacing={2} className={classes.container} alignItems="stretch">
                <Grid item xs={12} sm={6} className={classes.settings}>
                    <Card className={classes.settingsCard} variant="outlined">
                        <CardHeader
                            action={
                                <IconButton disabled={botState === "loading"} onClick={handleBotAction}>
                                    {botIcon}
                                </IconButton>
                            }
                            title="Bot Settings"
                            subheader={capitalize(botState)}
                        />
                        <CardContent className={classes.content}>
                            <TextField label="Twitch Channel" value={channel} onChange={(event) => setChannel(event.target.value.trim())} onBlur={() => { ipcRenderer.send('change-channel', channel) }} />
                        </CardContent>
                        <CardActions>
                            <Button size="small" onClick={() => { ipcRenderer.send('twitch-logout') }} startIcon={<TwitchIcon htmlColor='#6441a5' />}>Grant Permission</Button>
                        </CardActions>
                    </Card>
                    <Card className={classes.settingsCard} variant="outlined">
                        <CardHeader
                            title="Halo War API Settings"
                            action={
                                <IconButton onClick={() => shell.openExternal('https://developer.haloapi.com/products')}>
                                    <HelpOutlineIcon />
                                </IconButton>
                            }
                        />
                        <CardContent className={classes.content}>
                            <TextField label="Command" value={command} onChange={(event) => setCommand(event.target.value.trim())} error={command === ''} helperText={command === "" ? "Please enter a command, e.g., '!stats'" : ''} />
                            <TextField label="Ocp-Apim-Subscription-Key" value={ocpKey} onChange={(event) => setOcpKey(event.target.value.trim())} error={!isOpcKeyValid} helperText={!isOpcKeyValid ? "Please enter a valid Ocp-Apim-Subscription-Key'" : ''} onBlur={validateOprKey} />
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Card className={classes.logs} variant="outlined">
                        <CardHeader
                            className={classes.logsHeader}
                            title="Logs"
                        />
                        <CardContent className={classes.content}>
                            {logs.map((stats, idx, arr) => (
                                <Card key={stats.key} className={classes.logCard} ref={arr.length - 1 === idx ? lastLogRef : undefined}>
                                    <CardHeader
                                        title={`Stats request for ${stats.player}`}
                                        titleTypographyProps={{ variant: 'subtitle2' }}
                                        subheaderTypographyProps={{ variant: 'caption' }}
                                        subheader={moment(stats.time).format()}
                                        action={
                                            stats.error ? <ErrorOutlineIcon htmlColor='red' /> : <CheckIcon htmlColor='green' />
                                        }
                                    />
                                </Card>))}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </div >
    );
}