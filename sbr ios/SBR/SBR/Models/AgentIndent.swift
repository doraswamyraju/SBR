import Foundation

enum IndentStatus: String, Codable {
    case pending = "PENDING"
    case dispatched = "DISPATCHED"
    case rejected = "REJECTED"
}

struct IndentItem: Codable, Identifiable {
    var id: String { productId?.id ?? name }
    let productId: ProductRef?
    let name: String
    let sku: String?
    let requestedQuantity: Int
}

struct AgentIndent: Codable, Identifiable {
    var id: String { _id ?? "" }
    let _id: String?
    let agentId: HandoverAgent?
    let requestId: String?
    let items: [IndentItem]
    let status: IndentStatus
    let urgency: String?
    let agentRemarks: String?
    let inchargeRemarks: String?
    let dispatchedBy: HandoverAgent?
    let dispatchedAt: String?
    let createdAt: String?
    let updatedAt: String?
}
