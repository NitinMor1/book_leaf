import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

let io: SocketIOServer | null = null;

export function initSocketIO(server: HTTPServer) {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH'],
    },
  });

  io.on('connection', (socket) => {
    // Join author personal room
    socket.on('join:author', (authorId: string) => {
      socket.join(`author_${authorId}`);
    });

    // Join admin broadcast room
    socket.on('join:admins', () => {
      socket.join('admins');
    });

    // Join specific ticket thread room
    socket.on('join:ticket', (ticketId: string) => {
      socket.join(`ticket_${ticketId}`);
    });

    socket.on('leave:ticket', (ticketId: string) => {
      socket.leave(`ticket_${ticketId}`);
    });
  });

  return io;
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.io has not been initialized');
  }
  return io;
}

export function emitNewTicket(ticket: any) {
  if (io) {
    io.to('admins').emit('ticket:new', ticket);
  }
}

export function emitTicketUpdate(ticketId: string, authorId: string, updatedTicket: any) {
  if (io) {
    io.to(`ticket_${ticketId}`).emit('ticket:update', updatedTicket);
    io.to(`author_${authorId}`).emit('ticket:update', updatedTicket);
    io.to('admins').emit('ticket:update', updatedTicket);
  }
}

export function emitNewMessage(ticketId: string, authorId: string, message: any) {
  if (io) {
    // If it's an internal admin note, only send to admins
    if (message.isInternal) {
      io.to('admins').emit('ticket:message', { ticketId, message });
    } else {
      io.to(`ticket_${ticketId}`).emit('ticket:message', { ticketId, message });
      io.to(`author_${authorId}`).emit('ticket:message', { ticketId, message });
      io.to('admins').emit('ticket:message', { ticketId, message });
    }
  }
}
