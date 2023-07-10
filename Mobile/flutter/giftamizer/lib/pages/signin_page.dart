import 'dart:async';
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:giftamizer/main.dart';

class SignInPage extends StatefulWidget {
  const SignInPage({super.key});

  @override
  _SignInPageState createState() => _SignInPageState();
}

class _SignInPageState extends State<SignInPage> {
  bool _isLoading = false;
  bool _redirecting = false;
  late final TextEditingController _emailController = TextEditingController();
  late final TextEditingController _passwordController =
      TextEditingController();
  late final StreamSubscription<AuthState> _authStateSubscription;

  Future<void> _signIn() async {
    try {
      setState(() {
        _isLoading = true;
      });
      try {
        await supabase.functions.invoke('firebase/validateAuth', body: {
          'email': _emailController.text.trim(),
          'password': _passwordController.text.trim(),
        });
      } catch (e) {
        SnackBar(
          content: const Text('Unexpected validateAuth error occurred'),
          backgroundColor: Theme.of(context).colorScheme.error,
        );
      }

      await supabase.auth.signInWithPassword(
        email: _emailController.text.trim(),
        password: _passwordController.text.trim(),
      );
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
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  void initState() {
    _authStateSubscription = supabase.auth.onAuthStateChange.listen((data) {
      if (_redirecting) return;
      final session = data.session;
      if (session != null) {
        _redirecting = true;
        Navigator.of(context).pushReplacementNamed('/');
      }
    });
    super.initState();
  }

  @override
  void dispose() {
    _emailController.dispose();
    _authStateSubscription.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Sign In')),
      body: ListView(
        padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 12),
        children: [
          const Text('Sign in via the magic link with your email below'),
          const SizedBox(height: 18),
          AutofillGroup(
              child: Column(children: [
            TextFormField(
              controller: _emailController,
              autofillHints: const [AutofillHints.email],
              keyboardType: TextInputType.emailAddress,
              decoration: const InputDecoration(labelText: 'Email'),
            ),
            const SizedBox(height: 18),
            TextFormField(
              controller: _passwordController,
              obscureText: true,
              autofillHints: const [AutofillHints.password],
              keyboardType: TextInputType.text,
              decoration: const InputDecoration(labelText: 'Password'),
            )
          ])),
          const SizedBox(height: 18),
          ElevatedButton(
            onPressed: _isLoading ? null : _signIn,
            child: Text(_isLoading ? 'Loading' : 'Sign In'),
          ),
        ],
      ),
    );
  }
}
