import 'package:flutter/material.dart';
import 'package:giftamizer/tab_item.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'package:giftamizer/main.dart';
import 'package:giftamizer/bottom_navigation.dart';
import 'package:giftamizer/pages/account_page.dart';
import 'package:giftamizer/pages/group_page.dart';
import 'package:giftamizer/pages/lists_page.dart';

class App extends StatefulWidget {
  const App({super.key});

  @override
  State<StatefulWidget> createState() => AppState();
}

class AppState extends State<App> {
  var _currentTab = TabItem.groups;

  final _navigatorKeys = {
    TabItem.groups: GlobalKey<NavigatorState>(),
    TabItem.lists: GlobalKey<NavigatorState>(),
  };

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

  void _selectTab(TabItem tabItem) {
    if (tabItem == _currentTab) {
      // pop to first route
      _navigatorKeys[tabItem]!.currentState!.popUntil((route) => route.isFirst);
    } else {
      setState(() => _currentTab = tabItem);
    }
  }

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: () async {
        final isFirstRouteInCurrentTab =
            !await _navigatorKeys[_currentTab]!.currentState!.maybePop();
        if (isFirstRouteInCurrentTab) {
          // if not on the 'main' tab
          if (_currentTab != TabItem.groups) {
            // select 'main' tab
            _selectTab(TabItem.groups);
            // back button handled by app
            return false;
          }
        }
        // let system handle back button if we're on the first route
        return isFirstRouteInCurrentTab;
      },
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Giftamizer'),
          backgroundColor: Colors.green,
          actions: [
            Container(
              width: 58,
              child: PopupMenuButton(
                icon: const CircleAvatar(
                  backgroundImage: NetworkImage(
                      "https://4.bp.blogspot.com/-Jx21kNqFSTU/UXemtqPhZCI/AAAAAAAAh74/BMGSzpU6F48/s1600/funny-cat-pictures-047-001.jpg"),
                  backgroundColor: Colors.red,
                ),
                offset: Offset(0, 60),
                onSelected: (result) => {
                  if (result == '0')
                    {
                      Navigator.of(context).push(MaterialPageRoute(
                          builder: (context) => const AccountPage()))
                    }
                  else if (result == '1')
                    {_signOut()}
                },
                itemBuilder: (BuildContext context) {
                  return [
                    const PopupMenuItem<String>(
                      value: '0',
                      child: Row(
                        children: <Widget>[
                          Icon(Icons.person),
                          SizedBox(
                            width: 16,
                          ),
                          Text('My Account'),
                        ],
                      ),
                    ),
                    const PopupMenuItem<String>(
                      value: '1',
                      child: Row(
                        children: <Widget>[
                          Icon(Icons.logout),
                          SizedBox(
                            width: 16,
                          ),
                          Text('Logout'),
                        ],
                      ),
                    ),
                  ];
                },
              ),
            )
          ],
        ),
        body: Stack(children: <Widget>[
          Offstage(
              offstage: _currentTab != TabItem.groups,
              child: Groups(
                navigatorKey: _navigatorKeys[TabItem.groups],
              )),
          Offstage(
              offstage: _currentTab != TabItem.lists,
              child: Lists(
                navigatorKey: _navigatorKeys[TabItem.lists],
              )),
        ]),
        bottomNavigationBar: BottomNavigation(
          currentTab: _currentTab,
          onSelectTab: _selectTab,
        ),
      ),
    );
  }
}
