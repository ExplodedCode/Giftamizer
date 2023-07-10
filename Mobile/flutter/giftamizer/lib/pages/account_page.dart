import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:giftamizer/components/avatar.dart';
import 'package:giftamizer/main.dart';

class AccountPage extends StatefulWidget {
  const AccountPage({super.key});

  @override
  _AccountPageState createState() => _AccountPageState();
}

class _AccountPageState extends State<AccountPage> {
  final _fnameController = TextEditingController();
  final _lnameController = TextEditingController();
  final _bioController = TextEditingController();

  int? _avatarToken;
  var _loading = true;

  /// Called once a user id is received within `onAuthenticated()`
  Future<void> _getProfile() async {
    setState(() {
      _loading = true;
    });

    try {
      final userId = supabase.auth.currentUser!.id;
      final data = await supabase
          .from('profiles')
          .select<Map<String, dynamic>>()
          .eq('user_id', userId)
          .single();

      _fnameController.text = (data['first_name'] ?? '') as String;
      _lnameController.text = (data['last_name'] ?? '') as String;
      _bioController.text = (data['bio'] ?? '') as String;

      _avatarToken = data['avatar_token'];
    } on PostgrestException catch (error) {
      SnackBar(
        content: Text(error.message),
        backgroundColor: Theme.of(context).colorScheme.error,
      );
    } catch (error) {
      SnackBar(
        content: const Text('Unexpected error occurred'),
        backgroundColor: Theme.of(context).colorScheme.error,
      );
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  /// Called when user taps `Update` button
  Future<void> _updateProfile() async {
    setState(() {
      _loading = true;
    });
    final firstName = _fnameController.text.trim();
    final lastName = _lnameController.text.trim();
    final bio = _bioController.text.trim();
    final user = supabase.auth.currentUser;
    final updates = {
      'first_name': firstName,
      'last_name': lastName,
      'bio': bio
    };
    try {
      await supabase.from('profiles').update(updates).eq('user_id', user!.id);
      if (mounted) {
        const SnackBar(
          content: Text('Successfully updated profile!'),
        );
      }
    } on PostgrestException catch (error) {
      SnackBar(
        content: Text(error.message),
        backgroundColor: Theme.of(context).colorScheme.error,
      );
    } catch (error) {
      SnackBar(
        content: const Text('Unexpected error occurred'),
        backgroundColor: Theme.of(context).colorScheme.error,
      );
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  Future<void> _signOut() async {
    try {
      await supabase.auth.signOut();
    } on AuthException catch (error) {
      SnackBar(
        content: Text(error.message),
        backgroundColor: Theme.of(context).colorScheme.error,
      );
    } catch (error) {
      SnackBar(
        content: const Text('Unexpected error occurred'),
        backgroundColor: Theme.of(context).colorScheme.error,
      );
    } finally {
      if (mounted) {
        Navigator.of(context).pushReplacementNamed('/signin');
      }
    }
  }

  /// Called when image has been uploaded to Supabase storage from within Avatar widget
  Future<void> _onUpload(int avatarToken) async {
    try {
      final userId = supabase.auth.currentUser!.id;
      await supabase.from('profiles').update({
        'avatar_token': avatarToken,
      }).eq('user_id', userId);
      if (mounted) {
        const SnackBar(
          content: Text('Updated your profile image!'),
        );
      }
    } on PostgrestException catch (error) {
      SnackBar(
        content: Text(error.message),
        backgroundColor: Theme.of(context).colorScheme.error,
      );
    } catch (error) {
      SnackBar(
        content: const Text('Unexpected error occurred'),
        backgroundColor: Theme.of(context).colorScheme.error,
      );
    }
    if (!mounted) {
      return;
    }

    setState(() {
      _avatarToken = avatarToken;
    });
  }

  @override
  void initState() {
    super.initState();
    _getProfile();
  }

  @override
  void dispose() {
    _fnameController.dispose();
    _lnameController.dispose();
    _bioController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Account'),
        backgroundColor: Colors.green,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 12),
              children: [
                Avatar(
                  avatarToken: _avatarToken,
                  onUpload: _onUpload,
                ),
                const SizedBox(height: 18),
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _fnameController,
                        decoration:
                            const InputDecoration(labelText: 'First name'),
                      ),
                    ),
                    const SizedBox(
                      width: 16,
                    ),
                    Expanded(
                      child: TextFormField(
                        controller: _lnameController,
                        decoration:
                            const InputDecoration(labelText: 'Last name'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 18),
                TextFormField(
                  controller: _bioController,
                  decoration: const InputDecoration(labelText: 'Bio'),
                  minLines: 3,
                  maxLines: 7,
                ),
                const SizedBox(height: 18),
                ElevatedButton(
                  onPressed: _loading ? null : _updateProfile,
                  child: Text(_loading ? 'Saving...' : 'Update'),
                ),
                const SizedBox(height: 18),
                TextButton(onPressed: _signOut, child: const Text('Sign Out')),
              ],
            ),
    );
  }
}
