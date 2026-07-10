import React, { FunctionComponent } from 'react'
import { Paper, List, ListItemButton } from '@mui/material'
import { css } from '@emotion/css'

export type TAutocompleteItem = {
    keys: string[]
    value: any
    content: string | JSX.Element
}

interface TAutocompleteProps {
    items: TAutocompleteItem[]
    top: number
    left: number
    selectedIndex: number
    onClick: (selectedIndex: number) => void
}

const containerClass = css({
    minWidth: "200px",
    position: "absolute",
    zIndex: 10
})

const itemClass = css({
    cursor: "pointer"
})

const Autocomplete: FunctionComponent<TAutocompleteProps> = (props) => {
    if (!props.items.length) {
        return null
    }

    return (
        <Paper className={containerClass} style={{
            top: props.top,
            left: props.left
        }}>
            <List dense={true}>
                {props.items.map((item, index) => (
                    <ListItemButton
                        key={index}
                        className={itemClass}
                        selected={index === props.selectedIndex}
                        onClick={() => props.onClick(index)}
                    >
                        {item.content}
                    </ListItemButton>
                ))}
            </List>
        </Paper>
    )
}

export default Autocomplete
