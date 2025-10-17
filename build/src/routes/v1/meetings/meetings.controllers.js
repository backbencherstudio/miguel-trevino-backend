"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMeetingsData = getMeetingsData;
const node_fetch_1 = __importDefault(require("node-fetch"));
const clientApiUrl = "https://api.calendly.com/scheduled_events";
const userUrl = "https://api.calendly.com/users/16335ce1-5e56-4feb-b4ba-d462ad80d77b";
async function getMeetingsData(request, reply) {
    const apiToken = process.env.CALENDLY_API_KEY;
    if (!apiToken) {
        return reply.status(500).send({
            error: "Calendly API key is missing. Check your environment variables.",
        });
    }
    const url = `${clientApiUrl}?user=${encodeURIComponent(userUrl)}`;
    try {
        const response = await (0, node_fetch_1.default)(url, {
            headers: {
                Authorization: `Bearer ${apiToken}`,
                "Content-Type": "application/json",
            },
        });
        if (!response.ok) {
            throw new Error(`Calendly API returned ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        const events = data.collection || [];
        if (events.length === 0) {
            return reply.send({
                message: "No meetings found",
                meetings: [],
                total: 0,
            });
        }
        const meetings = await Promise.all(events.map(async (event) => {
            const organizer = event.event_memberships?.[0] || {};
            const organizerName = organizer.user_name || "Unknown Organizer";
            const organizerEmail = organizer.user_email || null;
            let inviteeName = "No invitee";
            let inviteeEmail = null;
            try {
                const inviteesResponse = await (0, node_fetch_1.default)(`${event.uri}/invitees`, {
                    headers: {
                        Authorization: `Bearer ${apiToken}`,
                        "Content-Type": "application/json",
                    },
                });
                if (inviteesResponse.ok) {
                    const inviteesData = await inviteesResponse.json();
                    const invitees = inviteesData.collection || [];
                    if (invitees.length > 0) {
                        const firstInvitee = invitees[0];
                        inviteeName = firstInvitee.name || "No invitee";
                        inviteeEmail = firstInvitee.email || null;
                    }
                }
            }
            catch (err) {
                console.warn(`Failed to fetch invitees for event ${event.uri}:`, err.message);
            }
            return {
                event_name: event.name || "Unnamed Event",
                start_time: event.start_time,
                end_time: event.end_time,
                meeting_link: event.location?.join_url || null,
                invitee_name: inviteeName,
                invitee_email: inviteeEmail,
                organizer_name: organizerName,
                organizer_email: organizerEmail,
            };
        }));
        return reply.send({
            meetings,
            total: meetings.length,
            message: `Successfully retrieved ${meetings.length} meeting(s)`,
        });
    }
    catch (error) {
        console.error("Failed to fetch meetings from Calendly:", error.message);
        return reply.status(500).send({
            error: "Could not retrieve meetings",
            details: error.message,
        });
    }
}
//# sourceMappingURL=meetings.controllers.js.map