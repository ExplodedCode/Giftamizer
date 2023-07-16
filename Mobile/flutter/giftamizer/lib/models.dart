class ProfileModel {
  final String id;
  final String? firstName;
  final String? lastName;

  const ProfileModel({
    required this.id,
    this.firstName,
    this.lastName,
  });

  static ProfileModel fromJson(Map<String, dynamic> json) => ProfileModel(
        id: json['user_id'] as String,
        firstName: json['first_name'] as String?,
        lastName: json['last_name'] as String?,
      );

  Map<String, dynamic> toJson() => <String, dynamic>{
        'user_id': id,
        'first_name': firstName,
        'last_name': lastName,
      };
}
