import 'package:flutter/material.dart';

class GroupsPage extends StatelessWidget {
  const GroupsPage({super.key, this.onPush});
  final ValueChanged<String>? onPush;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
        appBar: AppBar(
          title: const Text('Groups'),
        ),
        body: ListView(
          children: [
            ElevatedButton(
              child: const Text('Open group 1'),
              onPressed: () {
                onPush?.call('1');
              },
            ),
            ElevatedButton(
              child: const Text('Open group 2'),
              onPressed: () {
                onPush?.call('2');
              },
            )
          ],
        ));
  }
}

class GroupPage extends StatelessWidget {
  const GroupPage({super.key, this.onPush, required this.groupID});
  final ValueChanged<String>? onPush;
  final String groupID;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
        appBar: AppBar(
          title: Text('Group $groupID'),
        ),
        body: ListView(
          children: [
            ElevatedButton(
              child: const Text('Open member 1'),
              onPressed: () {
                onPush?.call('1');
              },
            ),
            ElevatedButton(
              child: const Text('Open member 2'),
              onPressed: () {
                onPush?.call('2');
              },
            )
          ],
        ));
  }
}

class MemberPage extends StatelessWidget {
  const MemberPage({super.key, required this.groupID, required this.userID});
  final String groupID;
  final String userID;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Member $groupID',
        ),
      ),
      body: Center(
        child: ElevatedButton(
          onPressed: () {
            Navigator.pop(context);
          },
          child: const Text('Go back!'),
        ),
      ),
    );
  }
}

class GroupRouter extends StatelessWidget {
  const GroupRouter({super.key, required this.groupID});
  final String groupID;

  void _push(BuildContext context, String groupID) {
    var routeBuilders = _routeBuilders(context);

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => routeBuilders[groupID]!(context),
      ),
    );
  }

  Map<String, WidgetBuilder> _routeBuilders(BuildContext context) {
    return {
      '/': (context) => GroupPage(
            onPush: (groupID) => _push(context, groupID),
            groupID: groupID,
          ),
      '1': (context) => MemberPage(
            groupID: groupID,
            userID: '1',
          ),
      '2': (context) => MemberPage(
            groupID: groupID,
            userID: '1',
          ),
    };
  }

  @override
  Widget build(BuildContext context) {
    final routeBuilders = _routeBuilders(context);
    return Navigator(
      key: super.key,
      initialRoute: '/',
      onGenerateRoute: (routeSettings) {
        return MaterialPageRoute(
          builder: (context) => routeBuilders[routeSettings.name!]!(context),
        );
      },
    );
  }
}

class Groups extends StatelessWidget {
  const Groups({super.key, required this.navigatorKey});
  final GlobalKey<NavigatorState>? navigatorKey;

  void _push(BuildContext context, String groupID) {
    var routeBuilders = _routeBuilders(context);

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => routeBuilders[groupID]!(context),
      ),
    );
  }

  Map<String, WidgetBuilder> _routeBuilders(BuildContext context) {
    return {
      '/': (context) => GroupsPage(
            onPush: (groupID) => _push(context, groupID),
          ),
      '1': (context) => const GroupRouter(
            groupID: '1',
          ),
      '2': (context) => const GroupRouter(
            groupID: '2',
          ),
    };
  }

  @override
  Widget build(BuildContext context) {
    final routeBuilders = _routeBuilders(context);
    return Navigator(
      key: navigatorKey,
      initialRoute: '/',
      onGenerateRoute: (routeSettings) {
        return MaterialPageRoute(
          builder: (context) => routeBuilders[routeSettings.name!]!(context),
        );
      },
    );
  }
}
