/**
 * Chatbot Web Component Entry Point
 * 
 * This chatbot is designed to run ONLY as a web component.
 * It registers the <eu-chatbot> custom element that can be embedded on any page.
 * 
 * The web component handles its own:
 * - Shadow DOM rendering
 * - Config loading
 * - React mounting
 * - Style encapsulation
 */

// Import i18n and global styles
import '@src/i18n';
import '@theme/styles/global.css';

// Register the chatbot web component
// This is the only thing this entry point does
import '@app/ChatbotElementWrapper';
