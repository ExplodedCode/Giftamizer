import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:giftamizer/pages/account_page.dart';
import 'package:giftamizer/pages/signin_page.dart';
import 'package:giftamizer/pages/splash_page.dart';

import 'app.dart';

Future<void> main() async {
  await Supabase.initialize(
    url: 'https://api.dev.giftamizer.com',
    anonKey:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICAgInJvbGUiOiAiYW5vbiIsCiAgICAiaXNzIjogInN1cGFiYXNlIiwKICAgICJpYXQiOiAxNjczMTU0MDAwLAogICAgImV4cCI6IDE4MzA5MjA0MDAKfQ.I4w9kivih-1NEOTXy4f4CJI2VebzCFp384yeZrFQSts',
  );

  runApp(const MyApp());
}

// Get a reference your Supabase client
final supabase = Supabase.instance.client;

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Giftamizer',
      theme: ThemeData.dark().copyWith(
        primaryColor: Colors.green,
        textButtonTheme: TextButtonThemeData(
          style: TextButton.styleFrom(
            foregroundColor: Colors.green,
          ),
        ),
        inputDecorationTheme: const InputDecorationTheme(
            floatingLabelStyle: TextStyle(
              color: Colors.green,
            ),
            focusedBorder: OutlineInputBorder(
              borderSide: BorderSide(
                style: BorderStyle.solid,
                color: Colors.green,
              ),
              borderRadius: BorderRadius.all(Radius.circular(4)),
            ),
            border: OutlineInputBorder(
              borderSide: BorderSide(
                style: BorderStyle.solid,
                color: Colors.green,
              ),
              borderRadius: BorderRadius.all(Radius.circular(4)),
            )),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            foregroundColor: Colors.white,
            backgroundColor: Colors.green,
          ),
        ),
      ),
      initialRoute: '/',
      routes: <String, WidgetBuilder>{
        '/': (_) => const SplashPage(),
        '/signin': (_) => const SignInPage(),
        '/app': (_) => const App(),
      },
    );
  }
}
