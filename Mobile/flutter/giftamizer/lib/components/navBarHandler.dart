import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:giftamizer/pages/account_page.dart';

import '../pages/home_page.dart';
import '../pages/groups_page.dart';
import '../pages/profile_page.dart';

class MenuItem {
  const MenuItem(this.iconData, this.text);
  final IconData iconData;
  final String text;
}

class NavBarHandler extends StatefulWidget {
  const NavBarHandler({Key? key}) : super(key: key);
  static const String route = '/';

  @override
  State<NavBarHandler> createState() => _NavBarHandlerState();
}

class _NavBarHandlerState extends State<NavBarHandler>
    with SingleTickerProviderStateMixin {
  final _buildBody = const <Widget>[HomeMenu(), GroupsMenu(), ProfileMenu()];

  final menuItemlist = const <MenuItem>[
    MenuItem(Icons.home, 'Home'),
    MenuItem(Icons.group, 'Groups'),
    MenuItem(Icons.person, 'Me'),
  ];

  late AnimationController _controller;
  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    );

    _controller.forward();
  }

  void showSnackBar() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        behavior: SnackBarBehavior.floating,
        duration: Duration(milliseconds: 600),
        margin: EdgeInsets.only(
            bottom: kBottomNavigationBarHeight, right: 2, left: 2),
        content: Text('Tap back button again to exit'),
      ),
    );
  }

  void hideSnackBar() {
    ScaffoldMessenger.of(context).hideCurrentSnackBar();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  DateTime oldTime = DateTime.now();
  DateTime newTime = DateTime.now();
  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: () async {
        final bool isExitingApp = await _navbarNotifier.onBackButtonPressed();
        if (isExitingApp) {
          newTime = DateTime.now();
          int difference = newTime.difference(oldTime).inMilliseconds;
          oldTime = newTime;
          if (difference < 1000) {
            hideSnackBar();
            return isExitingApp;
          } else {
            showSnackBar();
            return false;
          }
        } else {
          return isExitingApp;
        }
      },
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Giftamizer'),
          backgroundColor: Colors.green,
          actions: [
            SizedBox(
              width: 58,
              child: PopupMenuButton(
                icon: const CircleAvatar(
                  backgroundImage: NetworkImage(
                      "https://4.bp.blogspot.com/-Jx21kNqFSTU/UXemtqPhZCI/AAAAAAAAh74/BMGSzpU6F48/s1600/funny-cat-pictures-047-001.jpg"),
                  backgroundColor: Colors.red,
                ),
                offset: const Offset(0, 60),
                onSelected: (result) => {
                  if (result == '0')
                    {
                      navigate(context, AccountPage.route)
                      // Navigator.of(context).push(MaterialPageRoute(
                      //     builder: (context) => const AccountPage()))
                    }
                  // else if (result == '1')
                  //   {_signOut()}
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
        body: AnimatedBuilder(
            animation: _navbarNotifier,
            builder: (context, snapshot) {
              return Stack(
                children: [
                  IndexedStack(
                    index: _navbarNotifier.index,
                    children: [
                      for (int i = 0; i < _buildBody.length; i++)
                        Container(child: _buildBody[i])
                    ],
                  ),
                  Positioned(
                    bottom: 0,
                    left: 0,
                    right: 0,
                    child: AnimatedNavBar(
                        model: _navbarNotifier,
                        onItemTapped: (x) {
                          // User pressed  on the same tab twice
                          if (_navbarNotifier.index == x) {
                            _navbarNotifier.popAllRoutes(x);
                          } else {
                            _navbarNotifier.index = x;
                            _controller.reset();
                            _controller.forward();
                          }
                        },
                        menuItems: menuItemlist),
                  ),
                ],
              );
            }),
      ),
    );
  }
}

Future<void> navigate(BuildContext context, String route,
        {bool isDialog = false,
        bool isRootNavigator = true,
        dynamic arguments}) =>
    Navigator.of(context, rootNavigator: isRootNavigator)
        .pushNamed(route, arguments: arguments);

final homeKey = GlobalKey<NavigatorState>();
final productsKey = GlobalKey<NavigatorState>();
final profileKey = GlobalKey<NavigatorState>();

NavbarNotifier _navbarNotifier = NavbarNotifier();
// List<Color> colors = [mediumPurple, Colors.orange, Colors.teal];
// const Color mediumPurple = Color.fromRGBO(79, 0, 241, 1.0);
const String placeHolderText =
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';

class NavbarNotifier extends ChangeNotifier {
  int _index = 0;
  int get index => _index;
  bool _hideBottomNavBar = false;

  set index(int x) {
    _index = x;
    notifyListeners();
  }

  bool get hideBottomNavBar => _hideBottomNavBar;
  set hideBottomNavBar(bool x) {
    _hideBottomNavBar = x;
    notifyListeners();
  }

  // pop routes from the nested navigator stack and not the main stack
  // this is done based on the currentIndex of the bottom navbar
  // if the backButton is pressed on the initial route the app will be terminated
  FutureOr<bool> onBackButtonPressed() async {
    bool exitingApp = true;
    switch (_navbarNotifier.index) {
      case 0:
        if (homeKey.currentState != null && homeKey.currentState!.canPop()) {
          homeKey.currentState!.pop();
          exitingApp = false;
        }
        break;
      case 1:
        if (productsKey.currentState != null &&
            productsKey.currentState!.canPop()) {
          productsKey.currentState!.pop();
          exitingApp = false;
        }
        break;
      case 2:
        if (profileKey.currentState != null &&
            profileKey.currentState!.canPop()) {
          profileKey.currentState!.pop();
          exitingApp = false;
        }
        break;
      default:
        return false;
    }
    if (exitingApp) {
      return true;
    } else {
      return false;
    }
  }

  // pops all routes except first, if there are more than 1 route in each navigator stack
  void popAllRoutes(int index) {
    switch (index) {
      case 0:
        if (homeKey.currentState!.canPop()) {
          homeKey.currentState!.popUntil((route) => route.isFirst);
        }
        return;
      case 1:
        if (productsKey.currentState!.canPop()) {
          productsKey.currentState!.popUntil((route) => route.isFirst);
        }
        return;
      case 2:
        if (profileKey.currentState!.canPop()) {
          profileKey.currentState!.popUntil((route) => route.isFirst);
        }
        return;
      default:
        break;
    }
  }
}

class AnimatedNavBar extends StatefulWidget {
  const AnimatedNavBar(
      {Key? key,
      required this.model,
      required this.menuItems,
      required this.onItemTapped})
      : super(key: key);
  final List<MenuItem> menuItems;
  final NavbarNotifier model;
  final Function(int) onItemTapped;

  @override
  _AnimatedNavBarState createState() => _AnimatedNavBarState();
}

class _AnimatedNavBarState extends State<AnimatedNavBar>
    with SingleTickerProviderStateMixin {
  @override
  void didUpdateWidget(covariant AnimatedNavBar oldWidget) {
    if (widget.model.hideBottomNavBar != isHidden) {
      if (!isHidden) {
        _showBottomNavBar();
      } else {
        _hideBottomNavBar();
      }
      isHidden = !isHidden;
    }
    super.didUpdateWidget(oldWidget);
  }

  void _hideBottomNavBar() {
    _controller.reverse();
    return;
  }

  void _showBottomNavBar() {
    _controller.forward();
    return;
  }

  late AnimationController _controller;
  late Animation<double> animation;
  bool isHidden = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BottomNavigationBar(
      type: BottomNavigationBarType.fixed,
      currentIndex: widget.model.index,
      onTap: (x) {
        widget.onItemTapped(x);
      },
      elevation: 16.0,
      showUnselectedLabels: true,
      // unselectedItemColor: Colors.white54,
      // selectedItemColor: Colors.white,
      selectedItemColor: Colors.green,
      items: widget.menuItems
          .map((MenuItem menuItem) => BottomNavigationBarItem(
                backgroundColor: Colors.green,
                icon: Icon(menuItem.iconData),
                label: menuItem.text,
              ))
          .toList(),
    );
  }
}
