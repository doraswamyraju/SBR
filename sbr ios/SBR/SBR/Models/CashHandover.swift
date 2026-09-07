import Foundation

enum HandoverStatus: String, Codable {
    case submitted = "SUBMITTED"
    case acknowledged = "ACKNOWLEDGED"
    case discrepancy = "DISCREPANCY"
    case notSubmitted = "NOT_SUBMITTED"
}

struct HandoverAgent: Codable, Identifiable {
    var id: String { _id ?? "" }
    let _id: String?
    let name: String
    let email: String?
    let phone: String?
    
    enum CodingKeys: String, CodingKey {
        case _id, name, email, phone
    }
    
    init(from decoder: Decoder) throws {
        if let container = try? decoder.container(keyedBy: CodingKeys.self) {
            self._id = try? container.decode(String.self, forKey: ._id)
            self.name = (try? container.decode(String.self, forKey: .name)) ?? "Unknown"
            self.email = try? container.decode(String.self, forKey: .email)
            self.phone = try? container.decode(String.self, forKey: .phone)
        } else if let single = try? decoder.singleValueContainer(), let idStr = try? single.decode(String.self) {
            self._id = idStr
            self.name = "Agent"
            self.email = nil
            self.phone = nil
        } else {
            self._id = nil
            self.name = "Unknown"
            self.email = nil
            self.phone = nil
        }
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encodeIfPresent(_id, forKey: ._id)
        try container.encode(name, forKey: .name)
        try container.encodeIfPresent(email, forKey: .email)
        try container.encodeIfPresent(phone, forKey: .phone)
    }
}

private struct PartialRequestId: Codable {
    let _id: String?
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
    let storeInchargeId: HandoverAgent?
    let acknowledgedAmount: Double?
    let discrepancyAmount: Double?
    let inchargeNotes: String?
    let agentNotes: String?
    let submittedAt: String?
    let acknowledgedAt: String?
    let createdAt: String?
    let updatedAt: String?
    
    enum CodingKeys: String, CodingKey {
        case _id, agentId, date, totalCollectedCash, totalCash, completedRequests, status
        case acknowledgedBy, storeInchargeId, acknowledgedAmount, discrepancyAmount
        case inchargeNotes, agentNotes, submittedAt, acknowledgedAt, createdAt, updatedAt
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        self._id = try? container.decode(String.self, forKey: ._id)
        self.agentId = try? container.decode(HandoverAgent.self, forKey: .agentId)
        self.date = (try? container.decode(String.self, forKey: .date)) ?? ""
        
        let cash = (try? container.decode(Double.self, forKey: .totalCollectedCash))
            ?? (try? container.decode(Double.self, forKey: .totalCash))
            ?? 0.0
        self.totalCollectedCash = cash
        
        if let ids = try? container.decode([String].self, forKey: .completedRequests) {
            self.completedRequests = ids
        } else if let partials = try? container.decode([PartialRequestId].self, forKey: .completedRequests) {
            self.completedRequests = partials.compactMap { $0._id }
        } else {
            self.completedRequests = []
        }
        
        if let statusRaw = try? container.decode(String.self, forKey: .status) {
            self.status = HandoverStatus(rawValue: statusRaw.uppercased()) ?? .submitted
        } else {
            self.status = .submitted
        }
        
        let incharge = try? container.decode(HandoverAgent.self, forKey: .storeInchargeId)
        let ackBy = try? container.decode(HandoverAgent.self, forKey: .acknowledgedBy)
        self.storeInchargeId = incharge ?? ackBy
        self.acknowledgedBy = ackBy ?? incharge
        
        self.acknowledgedAmount = try? container.decode(Double.self, forKey: .acknowledgedAmount)
        self.discrepancyAmount = try? container.decode(Double.self, forKey: .discrepancyAmount)
        self.inchargeNotes = try? container.decode(String.self, forKey: .inchargeNotes)
        self.agentNotes = try? container.decode(String.self, forKey: .agentNotes)
        self.submittedAt = try? container.decode(String.self, forKey: .submittedAt)
        self.acknowledgedAt = try? container.decode(String.self, forKey: .acknowledgedAt)
        self.createdAt = try? container.decode(String.self, forKey: .createdAt)
        self.updatedAt = try? container.decode(String.self, forKey: .updatedAt)
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encodeIfPresent(_id, forKey: ._id)
        try container.encodeIfPresent(agentId, forKey: .agentId)
        try container.encode(date, forKey: .date)
        try container.encode(totalCollectedCash, forKey: .totalCollectedCash)
        try container.encodeIfPresent(completedRequests, forKey: .completedRequests)
        try container.encode(status, forKey: .status)
        try container.encodeIfPresent(acknowledgedBy, forKey: .acknowledgedBy)
        try container.encodeIfPresent(storeInchargeId, forKey: .storeInchargeId)
        try container.encodeIfPresent(acknowledgedAmount, forKey: .acknowledgedAmount)
        try container.encodeIfPresent(discrepancyAmount, forKey: .discrepancyAmount)
        try container.encodeIfPresent(inchargeNotes, forKey: .inchargeNotes)
        try container.encodeIfPresent(agentNotes, forKey: .agentNotes)
        try container.encodeIfPresent(submittedAt, forKey: .submittedAt)
        try container.encodeIfPresent(acknowledgedAt, forKey: .acknowledgedAt)
        try container.encodeIfPresent(createdAt, forKey: .createdAt)
        try container.encodeIfPresent(updatedAt, forKey: .updatedAt)
    }
}

struct AgentDailySummary: Codable {
    let agentId: String
    let date: String
    let totalCollectedCash: Double
    let completedJobsCount: Int
    let completedRequestIds: [String]
    let hasSubmittedHandover: Bool
    let latestHandover: CashHandover?
    
    enum CodingKeys: String, CodingKey {
        case agentId, date, totalCollectedCash, totalCash, completedJobsCount, requestCount
        case completedRequestIds, completedRequests, hasSubmittedHandover, alreadySubmitted
        case latestHandover, existingHandover
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        self.agentId = (try? container.decode(String.self, forKey: .agentId)) ?? ""
        self.date = (try? container.decode(String.self, forKey: .date)) ?? ""
        
        let cash = (try? container.decode(Double.self, forKey: .totalCollectedCash))
            ?? (try? container.decode(Double.self, forKey: .totalCash))
            ?? 0.0
        self.totalCollectedCash = cash
        
        let jobs = (try? container.decode(Int.self, forKey: .completedJobsCount))
            ?? (try? container.decode(Int.self, forKey: .requestCount))
            ?? 0
        self.completedJobsCount = jobs
        
        if let ids = try? container.decode([String].self, forKey: .completedRequestIds) {
            self.completedRequestIds = ids
        } else if let ids = try? container.decode([String].self, forKey: .completedRequests) {
            self.completedRequestIds = ids
        } else if let partials = try? container.decode([PartialRequestId].self, forKey: .completedRequests) {
            self.completedRequestIds = partials.compactMap { $0._id }
        } else {
            self.completedRequestIds = []
        }
        
        let submitted = (try? container.decode(Bool.self, forKey: .hasSubmittedHandover))
            ?? (try? container.decode(Bool.self, forKey: .alreadySubmitted))
            ?? false
        self.hasSubmittedHandover = submitted
        
        self.latestHandover = (try? container.decode(CashHandover.self, forKey: .latestHandover))
            ?? (try? container.decode(CashHandover.self, forKey: .existingHandover))
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(agentId, forKey: .agentId)
        try container.encode(date, forKey: .date)
        try container.encode(totalCollectedCash, forKey: .totalCollectedCash)
        try container.encode(completedJobsCount, forKey: .completedJobsCount)
        try container.encode(completedRequestIds, forKey: .completedRequestIds)
        try container.encode(hasSubmittedHandover, forKey: .hasSubmittedHandover)
        try container.encodeIfPresent(latestHandover, forKey: .latestHandover)
    }
}
