import '../main.dart';

class Profile {
  String user_id;

  Profile(this.user_id);
}

Future<Profile> getProfile() async {
  final userId = supabase.auth.currentUser!.id;
  final data =
      await supabase.from('profiles').select().eq('user_id', userId).single();

  return data;
}
