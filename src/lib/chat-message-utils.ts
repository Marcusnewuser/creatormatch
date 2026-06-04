import type { Message, MessageRoleContext } from '../types/database'

/** Whether the message should render on the right (outgoing) for the active viewer role. */
export function isOutgoingChatMessage(
  msg: Message,
  viewerRole: MessageRoleContext,
  creatorId: string,
  brandId: string,
): boolean {
  if (msg.sender_role) {
    return msg.sender_role === viewerRole
  }

  const myParticipantId = viewerRole === 'creator' ? creatorId : brandId

  if (creatorId !== brandId) {
    return msg.sender_id === myParticipantId
  }

  // Same profile on creator + brand slots: only sender_role distinguishes sides.
  if (msg.sender_role) {
    return msg.sender_role === viewerRole
  }

  return msg.sender_id === myParticipantId
}
