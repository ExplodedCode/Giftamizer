import 'package:flutter/material.dart';
import 'package:giftamizer/app.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:giftamizer/pages/account_page.dart';
import 'package:giftamizer/pages/signin_page.dart';
import 'package:giftamizer/pages/splash_page.dart';

Future<void> main() async {
  await Supabase.initialize(
    url: 'https://giftamizer.com',
    anonKey:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogImFub24iLAogICJpc3MiOiAic3VwYWJhc2UiLAogICJpYXQiOiAxNjk1MDIwNDAwLAogICJleHAiOiAxODUyODczMjAwCn0.iMJi-OrGmLKRQfxxXma-OnOXEstXpo9cZhj9zmtpr2w',
    authCallbackUrlHostname: 'login-callback',
    authFlowType: AuthFlowType.pkce,
    debug: true,
  );

  runApp(
    const ProviderScope(
      child: MyApp(),
    ),
  );
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
      theme: ThemeData().copyWith(
          primaryColor: Colors.green,
          appBarTheme: AppBarTheme(
            color: Colors.green.shade700,
          ),
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
          )),
      darkTheme: ThemeData.dark().copyWith(
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
          )), // standard dark theme
      themeMode: ThemeMode.system, // device controls theme

      // theme: ThemeData.dark().copyWith(
      //   primaryColor: Colors.green,
      //   textButtonTheme: TextButtonThemeData(
      //     style: TextButton.styleFrom(
      //       foregroundColor: Colors.green,
      //     ),
      //   ),
      //   inputDecorationTheme: const InputDecorationTheme(
      //       floatingLabelStyle: TextStyle(
      //         color: Colors.green,
      //       ),
      //       focusedBorder: OutlineInputBorder(
      //         borderSide: BorderSide(
      //           style: BorderStyle.solid,
      //           color: Colors.green,
      //         ),
      //         borderRadius: BorderRadius.all(Radius.circular(4)),
      //       ),
      //       border: OutlineInputBorder(
      //         borderSide: BorderSide(
      //           style: BorderStyle.solid,
      //           color: Colors.green,
      //         ),
      //         borderRadius: BorderRadius.all(Radius.circular(4)),
      //       )),
      //   elevatedButtonTheme: ElevatedButtonThemeData(
      //     style: ElevatedButton.styleFrom(
      //       foregroundColor: Colors.white,
      //       backgroundColor: Colors.green,
      //     ),
      //   ),
      // ),
      initialRoute: '/',
      routes: <String, WidgetBuilder>{
        '/': (_) => const SplashPage(),
        '/signin': (_) => const SignInPage(),
        '/app': (_) => const App(),
        AccountPage.route: (context) => const AccountPage(),
      },
    );
  }
}
