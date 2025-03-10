import { Condition, IO } from 'botpress/sdk'
import _ from 'lodash'

interface Params {
  ambiguityThreshold: number
}

export default {
  id: 'intent_is_ambiguous',
  label: 'Intent is ambiguous within topic',
  description: `The users's intention is can be interpreted as multiple intents within the same topic`,
  displayOrder: 1,
  params: {
    ambiguityThreshold: { label: 'Ambiguity threshold', type: 'number', defaultValue: 0.1 }
  },
  evaluate: (event: IO.IncomingEvent, { ambiguityThreshold }: Params) => {
    const currentTopic = _.get(event.state.session, 'nduContext.last_topic')
    const [highestTopic, topicPreds] =
      _.chain(event?.nlu?.predictions ?? {})
        .toPairs()
        .orderBy(x => x[1].confidence, 'desc')
        .filter(x => x[0] !== 'oos')
        .first()
        .value() || []

    if (!currentTopic || !highestTopic || currentTopic !== highestTopic) {
      // consider intent confusion only when predicted topic is same as current topic
      return 0
    }

    const higestIntents = _.chain(topicPreds.intents)
      .filter(i => i.label !== 'none')
      .orderBy('confidence', 'desc')
      .map('confidence')
      .take(2)
      .value()

    if (higestIntents.length <= 1) {
      // no confusion with a single or no intent(s)
      return 0
    }

    const gap = higestIntents[0] - higestIntents[1]
    if (gap > ambiguityThreshold) {
      return 0
    }

    return 1 - gap / ambiguityThreshold
  }
} as Condition
