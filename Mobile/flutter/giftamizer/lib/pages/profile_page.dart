/*
 * File: main.dart
 * Project: BottomNavigationBar demo
 * File Created: Wednesday, 26th May 2022 1:15:47 pm
 * Author: Mahesh Jamdade
 * -----
 * Last Modified: Saturday, 28th May 2022 4:42:07 pm
 * Modified By: Mahesh Jamdade
 * -----
 */

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:giftamizer/pages/account_page.dart';

import '../components/navBarHandler.dart';

class ProfileMenu extends StatelessWidget {
  const ProfileMenu({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Navigator(
        key: profileKey,
        initialRoute: '/',
        onGenerateRoute: (RouteSettings settings) {
          WidgetBuilder builder;
          switch (settings.name) {
            case '/':
              builder = (BuildContext _) => const UserProfile();
              break;
            default:
              builder = (BuildContext _) => const UserProfile();
          }
          return MaterialPageRoute(builder: builder, settings: settings);
        });
  }
}

class UserProfile extends StatelessWidget {
  static const String route = '/';

  const UserProfile({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
          centerTitle: false,
          actions: [
            IconButton(
              icon: const Icon(Icons.edit),
              onPressed: () {
                navigate(context, AccountPage.route);
              },
            )
          ],
          title: const Text('Hi User')),
      body: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text('Hi My Name is'),
                SizedBox(
                  width: 10,
                ),
                SizedBox(
                  width: 100,
                  child: TextField(
                    decoration: InputDecoration(),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
