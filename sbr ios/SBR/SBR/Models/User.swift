import Foundation

enum UserRole: String, Codable {
    case admin = "ADMIN"
    case agent = "AGENT"
    case customer = "CUSTOMER"
}

struct UserAddress: Codable, Identifiable, Hashable {
    var id: String {
        return _id ?? "\(title)-\(addressLine)"
    }
    var _id: String?
    var title: String // e.g. "Home", "Work", "Office"
    var addressLine: String
    var latitude: Double?
    var longitude: Double?
    
    init(
        _id: String? = nil,
        title: String,
        addressLine: String,
        latitude: Double? = nil,
        longitude: Double? = nil
    ) {
        self._id = _id
        self.title = title
        self.addressLine = addressLine
        self.latitude = latitude
        self.longitude = longitude
    }
}

struct User: Codable, Identifiable {
    let id: String
    let name: String
    let email: String
    let role: UserRole
    let phone: String?
    let address: String?
    let latitude: Double?
    let longitude: Double?
    var addresses: [UserAddress]?
    let photoUrl: String?
    let isRecurring: Bool?
    let nextServiceDate: String?
    let specialization: String?
    let location: String?
    let status: String?
    let rating: Double?
    let completedJobs: Int?
    let currentLat: Double?
    let currentLng: Double?
    let isAvailable: Bool?
    
    enum CodingKeys: String, CodingKey {
        case id
        case _id
        case name, email, role, phone, address, latitude, longitude, addresses, photoUrl, isRecurring, nextServiceDate, specialization, location, status, rating, completedJobs, currentLat, currentLng, isAvailable
    }
    
    init(
        id: String,
        name: String,
        email: String,
        role: UserRole = .customer,
        phone: String? = nil,
        address: String? = nil,
        latitude: Double? = nil,
        longitude: Double? = nil,
        addresses: [UserAddress]? = nil,
        photoUrl: String? = nil,
        isRecurring: Bool? = nil,
        nextServiceDate: String? = nil,
        specialization: String? = nil,
        location: String? = nil,
        status: String? = nil,
        rating: Double? = nil,
        completedJobs: Int? = nil,
        currentLat: Double? = nil,
        currentLng: Double? = nil,
        isAvailable: Bool? = nil
    ) {
        self.id = id
        self.name = name
        self.email = email
        self.role = role
        self.phone = phone
        self.address = address
        self.latitude = latitude
        self.longitude = longitude
        self.addresses = addresses
        self.photoUrl = photoUrl
        self.isRecurring = isRecurring
        self.nextServiceDate = nextServiceDate
        self.specialization = specialization
        self.location = location
        self.status = status
        self.rating = rating
        self.completedJobs = completedJobs
        self.currentLat = currentLat
        self.currentLng = currentLng
        self.isAvailable = isAvailable
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        
        // Handle id decoding fallback to ensure parsing compatibility with all endpoints
        if let decodedId = try container.decodeIfPresent(String.self, forKey: .id) {
            self.id = decodedId
        } else if let decodedUnderscoreId = try container.decodeIfPresent(String.self, forKey: ._id) {
            self.id = decodedUnderscoreId
        } else {
            throw DecodingError.keyNotFound(CodingKeys.id, DecodingError.Context(codingPath: container.codingPath, debugDescription: "Key id or _id not found in payload"))
        }
        
        // Required fields
        self.name = try container.decodeIfPresent(String.self, forKey: .name) ?? ""
        self.email = try container.decodeIfPresent(String.self, forKey: .email) ?? ""
        self.role = try container.decodeIfPresent(UserRole.self, forKey: .role) ?? .customer
        
        // Optional fields
        self.phone = try container.decodeIfPresent(String.self, forKey: .phone)
        self.address = try container.decodeIfPresent(String.self, forKey: .address)
        self.latitude = try container.decodeIfPresent(Double.self, forKey: .latitude)
        self.longitude = try container.decodeIfPresent(Double.self, forKey: .longitude)
        self.addresses = try container.decodeIfPresent([UserAddress].self, forKey: .addresses)
        self.photoUrl = try container.decodeIfPresent(String.self, forKey: .photoUrl)
        self.isRecurring = try container.decodeIfPresent(Bool.self, forKey: .isRecurring)
        self.nextServiceDate = try container.decodeIfPresent(String.self, forKey: .nextServiceDate)
        self.specialization = try container.decodeIfPresent(String.self, forKey: .specialization)
        self.location = try container.decodeIfPresent(String.self, forKey: .location)
        self.status = try container.decodeIfPresent(String.self, forKey: .status)
        self.rating = try container.decodeIfPresent(Double.self, forKey: .rating)
        self.completedJobs = try container.decodeIfPresent(Int.self, forKey: .completedJobs)
        self.currentLat = try container.decodeIfPresent(Double.self, forKey: .currentLat)
        self.currentLng = try container.decodeIfPresent(Double.self, forKey: .currentLng)
        self.isAvailable = try container.decodeIfPresent(Bool.self, forKey: .isAvailable)
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(id, forKey: .id)
        try container.encode(name, forKey: .name)
        try container.encode(email, forKey: .email)
        try container.encode(role, forKey: .role)
        try container.encodeIfPresent(phone, forKey: .phone)
        try container.encodeIfPresent(address, forKey: .address)
        try container.encodeIfPresent(latitude, forKey: .latitude)
        try container.encodeIfPresent(longitude, forKey: .longitude)
        try container.encodeIfPresent(addresses, forKey: .addresses)
        try container.encodeIfPresent(photoUrl, forKey: .photoUrl)
        try container.encodeIfPresent(isRecurring, forKey: .isRecurring)
        try container.encodeIfPresent(nextServiceDate, forKey: .nextServiceDate)
        try container.encodeIfPresent(specialization, forKey: .specialization)
        try container.encodeIfPresent(location, forKey: .location)
        try container.encodeIfPresent(status, forKey: .status)
        try container.encodeIfPresent(rating, forKey: .rating)
        try container.encodeIfPresent(completedJobs, forKey: .completedJobs)
        try container.encodeIfPresent(currentLat, forKey: .currentLat)
        try container.encodeIfPresent(currentLng, forKey: .currentLng)
        try container.encodeIfPresent(isAvailable, forKey: .isAvailable)
    }
}
