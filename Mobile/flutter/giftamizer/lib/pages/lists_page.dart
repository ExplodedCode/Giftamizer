import 'package:flutter/material.dart';

// class FirstRoute extends StatelessWidget {
//   const FirstRoute({super.key, this.onPush});
//   final ValueChanged<String>? onPush;
class FirstRoute extends StatelessWidget {
  const FirstRoute({super.key, this.onPush});
  final ValueChanged<String>? onPush;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
        appBar: AppBar(
          title: const Text('Lists'),
        ),
        body: ListView(
          children: [
            ElevatedButton(
              child: const Text('Open list 1'),
              onPressed: () {
                onPush?.call('1');
                // Navigator.push(
                //   context,
                //   MaterialPageRoute(builder: (context) => const SecondRoute()),
                // );
              },
            ),
            ElevatedButton(
              child: const Text('Open list 2'),
              onPressed: () {
                onPush?.call('2');
                // Navigator.push(
                //   context,
                //   MaterialPageRoute(builder: (context) => const SecondRoute()),
                // );
              },
            )
          ],
        ));
  }
}

class SecondRoute extends StatelessWidget {
  const SecondRoute({super.key, required this.groupID});
  final String groupID;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'List $groupID',
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

class Lists extends StatelessWidget {
  const Lists({super.key, required this.navigatorKey});
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
      '/': (context) => FirstRoute(
            onPush: (groupID) => _push(context, groupID),
          ),
      '1': (context) => const SecondRoute(
            groupID: '1',
          ),
      '2': (context) => const SecondRoute(
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
