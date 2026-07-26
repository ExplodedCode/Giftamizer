import React, { FunctionComponent } from 'react'
import { css } from '@emotion/css'
import { useTheme } from '@mui/material/styles'

interface IBlockquoteProps {
    children?: React.ReactNode
}

const CodeBlock: FunctionComponent<IBlockquoteProps> = (props) => {
    const { spacing, palette } = useTheme()
    const rootClass = css({
        backgroundColor: palette.grey[200],
        padding: spacing(1, 2, 1, 2)
    })

    return (
        <div className={rootClass}>
            {props.children}
        </div>
    )
}

export default CodeBlock
