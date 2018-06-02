
'use strict';

const socket_io = require('socket.io');

const http = require('http');
const server = http.createServer();

const io = socket_io(server, {
	path : '/',
	// pingTimeout : 60000,
	// pingInterval : 25000, // 默认每隔 25 秒向客户端发一次 ping 消息
});

var sockets = {};

process.on('SIGINT', () =>
{
	// 不断开与客户端的连接，则客户端默认会每隔 1~5 秒自动发起一次对服务器的重连
	// for (let id in sockets)
	// {
		// sockets[id].removeAllListeners();
		// sockets[id].disconnect(true);
	// }

	// 关闭 socket.io 服务器，不再接受客户端连接
	server.close();
	process.exit(0);
});

// 客户端回调
var cli_cb = function (...args)
{
	console.log('client callback:', ...args);
};

// 广播消息到除 socket 外的客户端
var broadcast = function (socket, event, ...args)
{
	socket.broadcast.emit(event, ...args);
};

io.on('connect', (socket) =>
{
	console.log('connection:', socket.id);
	sockets[socket.id] = socket;

	// 给刚建立连接的 server 客户端发送消息
	// console.log('before');
	socket.emit('cli_event', socket.id, Math.random(), cli_cb); // 异步回调 cli_cb
	// console.log('after');

	// 广播到除客户端 socket 自身外已连接 server 的所有客户端
	broadcast(socket, 'cli_broadcast', socket.id, { hello : socket.id, world : { lilei : undefined } });

	// 广播到所有连接 server 的客户端
	io.emit('cli_whole', socket.id, { hello : 'wolrd' });

	// 处理客户端发来的消息
	socket.on('srv_event', (id, param, fn_ack) =>
	{
		console.log('%s srv_event', socket.id, id, param);

		// 向客户端回复消息
		if (fn_ack)
		{
			fn_ack(socket.id, { srv_rpc : Math.random() });
		}
	})
	.on('broadcast_event', (id, param, fn_ack) => // 广播到所有客户端
	{
		console.log('%s broadcast_event', socket.id, id, param);
		broadcast(socket, 'cli_broadcast', socket.id, id, param);

		// 向客户端回复消息
		if (fn_ack)
		{
			fn_ack(socket.id, { srv_rpc : Math.random() });
		}
	});

	socket.on('disconnect', (reason) =>
	{
		broadcast(socket, 'cli_closed', socket.id);

		console.log('%s disconnected: %s', socket.id, reason);
		socket.removeAllListeners();
		socket.disconnect(true);
		delete sockets[socket.id];
	})
	.on('error', (err) =>
	{
		console.log('error: %s', err.stack);
	});
});

server.listen(12345);
