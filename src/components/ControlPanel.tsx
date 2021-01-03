import { List, ListItem, TextField } from "@material-ui/core";
import { ipcRenderer } from 'electron';
import React, { useEffect, useState } from "react";
import { useStyles } from "./ControlPanel.style";

type Props = {}

export const ControlPanel: React.FC<Props> = () => {
    const classes = useStyles();
    const [channel, setChannel] = useState("teampheenix");
    const [command, setCommand] = useState("!stats");
    const [queries, setQueries] = useState<string[]>([]);

    useEffect(() => {
        ipcRenderer.on('stats', (_event, args) => {
            setQueries((queries) => [args.player, ...queries]);
        });
    }, [])

    return (
        <div className={classes.root}>
            <TextField label="Twitch Channel" value={channel} onChange={(event) => setChannel(event.target.value.trim())} />
            <TextField label="Command" value={command} onChange={(event) => setCommand(event.target.value.trim())} />
            <List>{queries.map((player) => (<ListItem>{player}</ListItem>))}</List>

        </div>
    );
}