import 'package:giftamizer/pages/groups_page.dart';
import 'package:giftamizer/pages/home_page.dart';
import 'package:giftamizer/pages/profile_page.dart';
import 'package:giftamizer/pages/todo_page.dart';

enum TabItem {
  home(HomeMenu),
  groups(GroupsMenu),
  profile(TodoPage);

  const TabItem(this.item);
  final Type item;
}
