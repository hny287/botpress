import classnames from 'classnames'
import { inject } from 'mobx-react'
import React from 'react'

import { RootStore, StoreDef } from '../../store'
import { Message as MessageDetails } from '../../typings'

import { InlineFeedback } from './InlineFeedback'
import Message from './Message'

class MessageGroup extends React.Component<Props> {
  state = {
    hasError: false
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  /**
   * @deprecated 12.0
   * Here, we convert old format to the new format Botpress uses internally.
   * - payload: all the data (raw, whatever) that is necessary to display the element
   * - type: extracted from payload for easy sorting
   */
  convertPayloadFromOldFormat = data => {
    let payload = data.payload || data.message_data || data.message_raw || { text: data.message_text }
    if (!payload.type) {
      payload.type = data.message_type || data.message_data?.type || 'text'
    }

    // Keeping compatibility with old schema for the quick reply
    if (data.message_type === 'quick_reply' && !payload.text) {
      payload.text = data.message_text
    }

    if (data.message_type === 'file' && !payload.url) {
      payload.url = data.message_data?.url || data.message_raw?.url
    }

    if (this.props.messageWrapper && payload.type !== 'session_reset') {
      payload = {
        type: 'custom',
        module: this.props.messageWrapper.module,
        component: this.props.messageWrapper.component,
        wrapped: payload
      }
    }

    return payload
  }

  render() {
    const fromLabel = this.props.store.intl.formatMessage({
      id: this.props.isBot ? 'message.fromBotLabel' : 'message.fromMeLabel',
      defaultMessage: 'Me'
    })

    if (this.state.hasError) {
      return '* Cannot display message *'
    }

    return (
      <div
        role="main"
        className={classnames('bpw-message-big-container', {
          'bpw-from-user': !this.props.isBot,
          'bpw-from-bot': this.props.isBot
        })}
      >
        {this.props.avatar}
        <div role="region" className={'bpw-message-container'}>
          {this.props.showUserName && <div className={'bpw-message-username'}>{this.props.userName}</div>}
          <div aria-live="assertive" role="log" className={'bpw-message-group'}>
            <span data-from={fromLabel} className="from hidden" aria-hidden="true">
              {fromLabel}
            </span>
            {this.props.messages.map((data, i) => {
              const isLastMsg = i == this.props.messages.length - 1
              const payload = this.convertPayloadFromOldFormat(data)

              const showInlineFeedback =
                this.props.isBot &&
                isLastMsg &&
                (payload.wrapped ? payload.wrapped.collectFeedback : payload.collectFeedback)

              return (
                <Message
                  key={`msg-${i}`}
                  isHighlighted={
                    this.props.highlightedMessages && this.props.highlightedMessages.includes(data.incomingEventId)
                  }
                  inlineFeedback={
                    showInlineFeedback && (
                      <InlineFeedback
                        incomingEventId={data.incomingEventId}
                        onFeedback={this.props.onFeedback}
                        eventFeedbacks={this.props.store.eventFeedbacks}
                      />
                    )
                  }
                  fromLabel={fromLabel}
                  isLastOfGroup={i >= this.props.messages.length - 1}
                  isLastGroup={this.props.isLastGroup}
                  isBotMessage={!data.userId}
                  incomingEventId={data.incomingEventId}
                  payload={payload}
                  sentOn={data.sent_on}
                  onSendData={this.props.onSendData}
                  onFileUpload={this.props.onFileUpload}
                  bp={this.props.bp}
                  store={this.props.store}
                />
              )
            })}
          </div>
        </div>
      </div>
    )
  }
}

export default inject(({ store }: { store: RootStore }) => ({
  store,
  bp: store.bp,
  onFeedback: store.sendFeedback,
  onSendData: store.sendData,
  onFileUpload: store.uploadFile,
  messageWrapper: store.messageWrapper,
  showUserName: store.config.showUserName,
  highlightedMessages: store.view.highlightedMessages
}))(MessageGroup)

type Props = {
  isBot: boolean
  avatar: JSX.Element
  userName: string
  messages: MessageDetails[]
  isLastGroup: boolean
  onFileUpload?: any
  onSendData?: any
  onFeedback?: any
  store?: RootStore
  highlightedMessages?: string[]
} & Pick<StoreDef, 'showUserName' | 'messageWrapper' | 'bp'>
