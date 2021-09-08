import App from './App.svelte';


// window.onerror = function (msg, url, line) {
// 	alert("Message : " + msg );
// 	alert("url : " + url );
// 	alert("Line number : " + line );
// }

const app = new App({
	target: document.body,
	props: {}
});

export default app;