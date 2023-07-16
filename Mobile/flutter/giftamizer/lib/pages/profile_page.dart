import 'dart:async';

import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

import '../main.dart';
import '../models.dart';

final profileProvider = FutureProvider<ProfileModel>((ref) async {
  await Timer(Duration(seconds: 2), () {
    // <-- Delay here
  });

  final userId = supabase.auth.currentUser!.id;
  final response =
      await supabase.from('profiles').select().eq('user_id', userId).single();

  final userModel = ProfileModel.fromJson(response as Map<String, dynamic>);

  return userModel;
});

class ProfileMenu extends HookConsumerWidget {
  const ProfileMenu({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    AsyncValue<ProfileModel> profile = ref.watch(profileProvider);

    return profile.when(
      loading: () => const CircularProgressIndicator(),
      error: (err, stack) => Text('Error: $err'),
      data: (profile) {
        return ListView(
            padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 12),
            children: [
              Text(profile.firstName!),
              ElevatedButton(
                onPressed: () => ref.refresh(profileProvider),
                child: const Text('Refresh'),
              ),
            ]);
      },
    );
  }
}
