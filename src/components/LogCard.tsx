import moment from "moment";
import React, { useState } from "react";
import { PlayerStats } from "../rest-client/rest-client";
import { useStyles } from "./LogCard.style";
import CheckIcon from '@material-ui/icons/Check';
import ErrorOutlineIcon from '@material-ui/icons/ErrorOutline';
import { Card, CardActions, CardContent, Collapse, IconButton, Typography } from "@material-ui/core";
import { CardHeader } from "@material-ui/core";
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

type Props = {
    stats: PlayerStats,
}

export const LogCard = React.forwardRef(({ stats }: Props, ref) => {
    const classes = useStyles();
    const [expanded, setExpaned] = useState<boolean>(false);

    const text = stats.games > 0 ? `${stats.wins} Wins, ${stats.losses} Losses, ${stats.winrate}% Winrate` : `No stats found.`

    return (
        <Card key={stats.key} className={classes.root} ref={ref}>
            <CardHeader
                title={`Stats of ${stats.player}`}
                subheader={moment(stats.time).format()}
                titleTypographyProps={{ variant: 'subtitle2' }}
                subheaderTypographyProps={{ variant: 'caption' }}
                action={
                    stats.error ? <ErrorOutlineIcon htmlColor='red' fontSize='small' /> : <CheckIcon htmlColor='green' fontSize='small' />
                }
            />
            <CardActions disableSpacing className={classes.actions}>
                <IconButton
                    onClick={() => setExpaned((state) => !state)}
                    aria-expanded={expanded}
                    size='small'
                    style={expanded ? { transform: 'rotate(180deg)' } : {}}
                >
                    <ExpandMoreIcon />
                </IconButton>
            </CardActions>
            <Collapse in={expanded} timeout="auto" unmountOnExit>
                <CardContent className={classes.stats}>
                    <Typography variant='caption'>
                        {text}
                    </Typography>
                </CardContent>
            </Collapse>
        </Card>
    );
});