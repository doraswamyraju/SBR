import Foundation

enum HandoverStatus: String, Codable {
    case submitted = "SUBMITTED"
    case acknowledged = "ACKNOWLEDGED"
    case discrepancy = "DISCREPANCY"
}

struct HandoverAgent: Codable, Identifiable {
    var id: String { _id ?? "" }
    let _id: String?
    let name: String
    let email: String?
    let phone: String?
}

struct CashHandover: Codable, Identifiable {
    var id: String { _id ?? "" }
    let _id: String?
    let agentId: HandoverAgent?
    let date: String
    let totalCollectedCash: Double
    let completedRequests: [String]?
    let status: HandoverStatus
    let acknowledgedBy: HandoverAgent?
    let acknowledgedAmount: Double?
    let discrepancyAmount: Double?
    let inchargeNotes: String?
    let agentNotes: String?
    let submittedAt: String?
    let acknowledgedAt: String?
    let createdAt: String?
    let updatedAt: String?
}

struct AgentDailySummary: Codable {
    let agentId: String
    let date: String
    let totalCollectedCash: Double
    let completedJobsCount: Int
    let completedRequestIds: [String]
    let hasSubmittedHandover: Bool
    let latestHandover: CashHandover?
}
