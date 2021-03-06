"use strict";

function publishModel(req, res, next) {

    var model = req.model,
        status = res.getStatus(),
        socket = req.getTransport(),
        method = req.getMethod(),
        type = req.getType(),
        session = req.session,
        room = session.activeRoomID || "";

    if (req.getTransportType() !== "websocket") {
        //no websocket transport, skipping push
        next();
        return;
    }

    //only emit for success and NOT for read-requests
    if (status === "success" && type === "service" && method !== "read") {

        //create
        if (method === "create") {
            //should have ID and everything baked in
            socket.broadcast.to(room).emit("remoteCreate", model.getUrl(), model.ids, model.toObject());
        }

        //update
        if (method === "update") {
            //should have ID and everything baked in
            socket.broadcast.to(room).emit("remoteUpdate", model.getUrl(), model.ids, model.toObject());
        }

        //update
        if (method === "destroy") {
            //should have ID and everything baked in
            socket.broadcast.to(room).emit("remoteDestroy", req.getPath(), req.ids);
        }
    }

    next();
}

module.exports = publishModel;