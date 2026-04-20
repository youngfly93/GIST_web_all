import r2wc from '@r2wc/react-to-web-component';
import { DbgistChat } from './DbgistChat';

// Web Component registration. Attributes map to props (kebab-case → camelCase).
// Usage in Shiny UI:
//   <dbgist-chat
//     backend-url="/api/chat"
//     session-id="abc123"
//     app-tag="transcriptomics"
//     default-open="false"
//     theme="light"
//   ></dbgist-chat>
const DbgistChatElement = r2wc(DbgistChat, {
  props: {
    backendUrl: 'string',
    sessionId:  'string',
    appTag:     'string',
    defaultOpen:'boolean',
    theme:      'string'
  }
});

if (!customElements.get('dbgist-chat')) {
  customElements.define('dbgist-chat', DbgistChatElement);
}

export { DbgistChat };
