import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:giftamizer/main.dart';

class Avatar extends StatefulWidget {
  const Avatar({
    super.key,
    required this.avatarToken,
    required this.onUpload,
  });

  final int? avatarToken;
  final void Function(int) onUpload;

  @override
  _AvatarState createState() => _AvatarState();
}

class _AvatarState extends State<Avatar> {
  bool _isLoading = false;
  final user = supabase.auth.currentUser;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        if (widget.avatarToken == null)
          Container(
            width: 150,
            height: 150,
            color: Colors.grey,
            child: const Center(
              child: Text('No Image '),
            ),
          )
        else
          Material(
              color: Colors.grey,
              // borderRadius: BorderRadius.circular(32),
              elevation: 8,
              shape: const CircleBorder(),
              clipBehavior: Clip.antiAliasWithSaveLayer,
              child: Container(
                decoration: BoxDecoration(
                    color: Colors.transparent,
                    border: Border.all(color: Colors.green, width: 3),
                    shape: BoxShape.circle),
                child: InkWell(
                  onTap: _isLoading ? null : _upload,
                  child: Ink.image(
                    image: NetworkImage(
                        '${supabase.storageUrl}/object/public/avatars/${user!.id}?${widget.avatarToken}'),
                    height: 150,
                    width: 150,
                    fit: BoxFit.cover,
                  ),
                ),
              )),
      ],
    );
  }

  Future<void> _upload() async {
    final picker = ImagePicker();
    final imageFile = await picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 300,
      maxHeight: 300,
    );
    if (imageFile == null) {
      return;
    }
    setState(() => _isLoading = true);

    try {
      final bytes = await imageFile.readAsBytes();
      final user = supabase.auth.currentUser;
      await supabase.storage.from('avatars').uploadBinary(user!.id, bytes,
          fileOptions: FileOptions(
              contentType: imageFile.mimeType,
              cacheControl: '3600',
              upsert: true));
      widget.onUpload(DateTime.now().millisecondsSinceEpoch);
    } on StorageException catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(error.message),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Unexpected error occurred'),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
    }

    setState(() => _isLoading = false);
  }
}
