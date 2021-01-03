import { Button, TextField } from "@material-ui/core";
import React, { useState } from "react";
import { useStyles } from "./ControlPanel.style";
const { ipcRenderer } = require('electron');

type Props = {}

export const ControlPanel: React.FC<Props> = () => {
    const classes = useStyles();
    const [player, setPlayer] = useState("yodesla");

    return (
        <div className={classes.root}>
            <TextField label="Gameaccount" value={player} onChange={(event) => setPlayer(event.target.value)} />
            <Button variant="contained" onClick={() => ipcRenderer.send("player-stats", player)}>Query</Button>
        </div>
    );
}