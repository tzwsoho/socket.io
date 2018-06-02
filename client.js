
'use strict'

const socket_io_client = require('socket.io-client');
const socket = socket_io_client('http://127.0.0.1:12345');

process.on('SIGINT', () =>
{
	socket.disconnect();
});

// 服务器回复的消息
var srv_cb = function (...args)
{
	console.log('server callback:', ...args);
};

socket.on('connect', () =>
{
	console.log('%s connected', socket.id);
})
.on('disconnect', (reason) =>
{
	console.log('Disconnected: %s', reason);
	// socket.disconnect();
})
.on('reconnect', (attempt) => // 重连成功会触发此事件
{
	// attempt 为尝试重连的次数
	console.log('reconnect', attempt);
})
.on('reconnect_attempt', () =>
{
	console.log('reconnect_attempt');
})
.on('reconnecting', (attempt) => // 正在重连时会触发此事件
{
	console.log('reconnecting', attempt);
})
.on('reconnect_error', (err) =>
{
	console.log('reconnect_error', err);
})
.on('reconnect_failed', () =>
{
	console.log('reconnect_failed');
})
.on('ping', () =>
{
	console.log('ping received');
})
.on('pong', (latency) =>
{
	// latency 为从发送 ping 后到收到服务器回应 pong 中间间隔的毫秒数
	console.log('pong %d ms', latency);
})
.on('error', (err) =>
{
	console.log('error: %s', err.stack);
})
// 服务器发来一般消息
.on('cli_event', (id, param, fn_ack) =>
{
	console.log('%s cli_event', id, param);

	socket.emit('srv_event', socket.id, param, srv_cb);

	// 回复服务器消息
	if (fn_ack)
	{
		fn_ack(socket.id, { client : Math.random() });
	}
})
// 服务器发来其他客户端消息
.on('cli_broadcast', (id, ...args) =>
{
	console.log('%s cli_broadcast', id, ...args);
})
// 服务器发来广播消息
.on('cli_whole', (id, ...args) =>
{
	console.log('%s cli_whole', id, ...args);
})
// 有其他客户端断开服务器
.on('cli_closed', (id) =>
{
	console.log('client %s was closed', id);
});
