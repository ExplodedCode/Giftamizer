import React, { FunctionComponent } from 'react'
import { css } from '@emotion/css'
import { useTheme } from '@mui/material/styles'

interface IBlockquoteProps {
    children?: React.ReactNode
}

const Blockquote: FunctionComponent<IBlockquoteProps> = (props) => {
    const { palette } = useTheme()
    const rootClass = css({
        fontStyle: "italic",
        color: palette.grey[800],
        borderLeft: `4px solid ${palette.grey.A100}`
    })

    return (
        <div className={rootClass}>
            {props.children}
        </div>
    )
}

export default Blockquote
