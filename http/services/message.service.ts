import { privateApi } from "@/http/api/privateApi";

export interface MessageConversation { id:string; userOneId:string; userTwoId:string; contextType:string; contextId?:string|null; contextPost?:any; otherUserId?:string; otherUser?:{id:string;name:string}|null; lastMessageAt?:string|null; unreadCount?:number; lastMessage?:ChatMessage|null; createdAt:string; updatedAt:string; }
export interface ChatMessage { id:string; conversationId:string; senderId:string; receiverId:string; content:string; type:string; deliveredAt?:string|null; seenAt?:string|null; editedAt?:string|null; replyToMessageId?:string|null; reactions?:Record<string,string>; createdAt:string; mediaUrl?:string|null; mediaOriginalName?:string|null; mediaMimeType?:string|null; mediaSize?:number|null; mediaStorage?:string|null; attachment?:any; }

export const messageService = {
  adminListUsers: async (query="") => (await privateApi.get("/message/admin/users",{params:query.trim()?{q:query.trim()}:undefined})).data,
  adminGetUserConversations: async (userId:string) => (await privateApi.get(`/message/admin/users/${userId}/conversations`)).data,
  adminGetConversationMessages: async (conversationId:string) => (await privateApi.get(`/message/admin/conversations/${conversationId}/messages`)).data||[],
  adminReplyAsUser: async (conversationId:string,userId:string,content:string) => (await privateApi.post(`/message/admin/conversations/${conversationId}/reply-as/${userId}`,{content})).data,
  getCallCredentials: async () => (await privateApi.get("/message/call-credentials")).data,
  sendMedia: async (conversationId:string,file:File,caption?:string) => { const f=new FormData(); f.append("file",file); if(caption?.trim())f.append("caption",caption.trim()); return (await privateApi.post(`/message/conversations/${conversationId}/media`,f)).data; },
  getMediaBlob: async (messageId:string) => (await privateApi.get(`/message/media/${messageId}`,{responseType:"blob"})).data as Blob,
  startByUser: async (userId:string)=>(await privateApi.post(`/message/start-by-user/${userId}`)).data,
  searchMessages: async (query:string)=>(await privateApi.get("/message/search-messages",{params:{q:query}})).data,
  searchUsersByPhone: async (query:string)=>(await privateApi.get("/message/search-users",{params:{q:query}})).data,
  findProfileByContact: async (contact:string)=>(await privateApi.post("/message/find-profile-by-contact",{contact})).data,
  startByContact: async (contact:string)=>(await privateApi.post("/message/start-by-contact",{contact})).data,
  startByPhone: async (phoneNumber:string)=>(await privateApi.post("/message/start-by-phone",{phoneNumber})).data,
  createConversation: async (otherUserId:string,contextType="USER",contextId?:string|null)=>(await privateApi.post("/message/conversations",{otherUserId,contextType,contextId:contextId||null})).data,
  startForJob: async (jobId:string)=>(await privateApi.post(`/message/jobs/${jobId}`)).data,
  sendRoomInquiry: async (roomId:string,content:string)=>(await privateApi.post(`/message/rooms/${roomId}/send`,{content})).data,
  startForRoom: async (roomId:string,content?:string)=>(await privateApi.post(`/message/rooms/${roomId}`,{content})).data,
  getUnreadCount: async ()=>(await privateApi.get("/message/unread-count")).data,
  getConversations: async ():Promise<MessageConversation[]> => (await privateApi.get("/message/conversations")).data||[],
  getMessages: async (conversationId:string,options?:{before?:string;limit?:number}):Promise<ChatMessage[]> => (await privateApi.get(`/message/conversations/${conversationId}/messages`,{params:options})).data||[],
  sendMessage: async (conversationId:string,content:string,roomId?:string,replyToMessageId?:string):Promise<ChatMessage> => (await privateApi.post(`/message/conversations/${conversationId}/messages`,{content,roomId:roomId||undefined,replyToMessageId:replyToMessageId||undefined})).data,
  createPaymentRequest: async (conversationId:string,amount:number)=>(await privateApi.post(`/message/conversations/${conversationId}/direct-payment-requests`,{amount})).data,
  payPaymentRequest: async (paymentId:string)=>(await privateApi.post(`/message/direct-payments/${paymentId}/pay`)).data,
  requestPaymentRelease: async (paymentId:string)=>(await privateApi.post(`/message/direct-payments/${paymentId}/release-otp`)).data as {success:boolean;paymentId:string;expiresInSeconds:number;maskedEmail:string},
  confirmPaymentRelease: async (paymentId:string,otp:string)=>(await privateApi.post(`/message/direct-payments/${paymentId}/release`,{otp})).data as {payment:any;message:ChatMessage},
  disputePayment: async (paymentId:string,reason?:string)=>(await privateApi.post(`/message/payments/${paymentId}/dispute`,{reason})).data,
  editMessage: async (messageId:string,content:string):Promise<ChatMessage> => (await privateApi.patch(`/message/messages/${messageId}`,{content})).data,
  reactToMessage: async (messageId:string,emoji:string)=>(await privateApi.patch(`/message/messages/${messageId}/reaction`,{emoji})).data,
  deleteMessage: async (messageId:string)=>(await privateApi.delete(`/message/messages/${messageId}`)).data,
  recordMissedCall: async (conversationId:string,mode:"audio"|"video")=>(await privateApi.post(`/message/conversations/${conversationId}/missed-call`,{mode})).data,
  markSeen: async (conversationId:string)=>(await privateApi.patch(`/message/conversations/${conversationId}/seen`)).data,
};
