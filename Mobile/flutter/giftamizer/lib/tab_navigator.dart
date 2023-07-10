// import 'package:flutter/material.dart';
// import 'package:giftamizer/detail_page.dart';
// import 'package:giftamizer/list_page.dart';
// import 'package:giftamizer/tab_item.dart';

// class TabNavigatorRoutes {
//   static const String root = '/';
//   static const String detail = '/detail';
// }

// class TabNavigator extends StatelessWidget {
//   const TabNavigator(
//       {super.key, required this.navigatorKey, required this.tabItem});
//   final GlobalKey<NavigatorState>? navigatorKey;
//   final TabItem tabItem;

//   void _push(BuildContext context, {int materialIndex = 500}) {
//     var routeBuilders = _routeBuilders(context, materialIndex: materialIndex);

//     Navigator.push(
//       context,
//       MaterialPageRoute(
//         builder: (context) =>
//             routeBuilders[TabNavigatorRoutes.detail]!(context),
//       ),
//     );
//   }

//   Map<String, WidgetBuilder> _routeBuilders(BuildContext context,
//       {int materialIndex = 500}) {
//     return {
//       TabNavigatorRoutes.root: (context) => ListPage(
//             page: tabItem.page,
//             title: tabItem.name,
//             onPush: (materialIndex) =>
//                 _push(context, materialIndex: materialIndex),
//           ),
//       TabNavigatorRoutes.detail: (context) => DetailPage(
//             page: tabItem.page,
//             title: tabItem.name,
//             materialIndex: materialIndex,
//           ),
//     };
//   }

//   @override
//   Widget build(BuildContext context) {
//     final routeBuilders = _routeBuilders(context);
//     return Navigator(
//       key: navigatorKey,
//       initialRoute: TabNavigatorRoutes.root,
//       onGenerateRoute: (routeSettings) {
//         return MaterialPageRoute(
//           builder: (context) => routeBuilders[routeSettings.name!]!(context),
//         );
//       },
//     );
//   }
// }
