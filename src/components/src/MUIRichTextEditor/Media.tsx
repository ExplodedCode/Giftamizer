import React, { FunctionComponent } from 'react'
import classNames from 'classnames'
import { ContentState, ContentBlock } from 'draft-js'
import { css } from '@emotion/css'
import { useTheme } from '@mui/material/styles'

interface IMediaProps {
    block: ContentBlock
    contentState: ContentState
    blockProps: any
    onClick: (block: ContentBlock) => void
}

const rootClass = css({
    margin: "5px 0 1px",
    outline: "none"
})

const centeredClass = css({
    textAlign: "center"
})

const leftAlignedClass = css({
    textAlign: "left"
})

const rightAlignedClass = css({
    textAlign: "right"
})

const Media: FunctionComponent<IMediaProps> = (props) => {
    const { shadows } = useTheme()
    const editableClass = css({
        cursor: "pointer",
        "&:hover": {
            boxShadow: shadows[3]
        }
    })
    const focusedClass = css({
        boxShadow: shadows[3]
    })

    const { url, width, height, alignment, type } = props.contentState.getEntity(props.block.getEntityAt(0)).getData()
    const { onClick, readOnly, focusKey } = props.blockProps

    const htmlTag = () => {
        const componentProps = {
            src: url,
            className: classNames(rootClass, {
                [editableClass]: !readOnly,
                [focusedClass]: !readOnly && focusKey === props.block.getKey()
            }),
            width: width,
            height: type === "video" ? "auto" : height,
            onClick: () => {
                if (readOnly) {
                    return
                }
                onClick(props.block)
            }
        }

        if (!type || type === "image") {
            return <img alt='' {...componentProps} />
        }
        if (type === "video") {
            return <video {...componentProps} autoPlay={false} controls />
        }
        return null
    }

    return (
        <div className={classNames({
            [centeredClass]: alignment === "center",
            [leftAlignedClass]: alignment === "left",
            [rightAlignedClass]: alignment === "right"
        })}>
            {htmlTag()}
        </div>
    )
}

export default Media
